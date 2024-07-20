import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { connectToDatabase, closeDatabase, 
  createProperty, updateProperty } from './mongodb.js';

async function runCrawler() {
  await connectToDatabase();

  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
      log.info(`Processing ${page.url()}`);

      // 1: check if logged in
      const HEADER_XPATH = 'crx-header-content';
      const SAVE_XPATH = 'crx-saved-link';
      const SIGNUP_XPATH = 'button.signup';
      const SIGNUP_MODAL_XPATH = '#signupModal';
      const SUBMIT_XPATH = 'button[type="submit"]';
  
      // get text of save button using locator
      await page.waitForSelector(HEADER_XPATH);
      const saveTextElem = await page.$(SAVE_XPATH);
      const saveText = await saveTextElem?.textContent();
      log.info(`Save text: ${saveText}`);

      // if not logged in, login
      if (!saveText?.includes('Saved')) {
        log.info('Logging in...');

        const username = process.env.CREXI_USERNAME;
        const password = process.env.CREXI_PASSWORD;

        if (!username || !password) {
          log.error('Missing username or password');
          return;
        }

        // click on "sign up or login" button
        await page.click(SIGNUP_XPATH);

        // wait for sign up form and click on login tab
        await page.waitForSelector(SIGNUP_MODAL_XPATH);
        await page.locator('mat-dialog-container').first().locator("div.tab").nth(1).click();

        // wait for login form
        await page.waitForSelector(SUBMIT_XPATH);

        // fill in form
        await page.fill('#login-form input[formcontrolname="email"]', username);
        await page.fill('#login-form input[formcontrolname="password"]', password);

        // click on login button
        await page.click(SUBMIT_XPATH);
        log.info('Submitted login form');

        // wait for login to complete
        await page.waitForSelector(SAVE_XPATH);
        log.info('Logged in successfully');
      }

      log.info('Crawling...');

      const LIST_XPATH = 'crx-property-tile-aggregate';
      const LINK_XPATH = LIST_XPATH + ' a.cui-card-cover-link';

      if (page.url().includes('/properties?')) {
        log.info(`Extracting PAGE links`);

        await page.waitForSelector(LIST_XPATH);

        // get links
        const extractedLinks = await page.$$eval(LINK_XPATH, (anchors) =>
          anchors.map((anchor) => anchor.getAttribute('href')?.split('?')[0])
        );

        const base = new URL(page.url()).origin;
        log.info(`Base URL: ${base}`);

        // save property links into database
        for (const link of extractedLinks) {
          if (link?.includes('/properties/')) {
            const property = await createProperty({
              url: link,
              status: 'PENDING',
            });

            // queue link
            if (!property) {
              const queue = await RequestQueue.open();
              await queue.addRequest({ url: base + link });  
            }
          } else if (link?.includes('/properties?')) {
            const queue = await RequestQueue.open();
            await queue.addRequest({ url: link });
          }
        }

      } else {
        log.info('Extracting PROPERTY DETAILS');

        const INFO_XPATH = 'crx-sales-pdp-info-tab';
        const DETAILS_XPATH = '.property-details-item';

        await page.waitForSelector(INFO_XPATH);

        // address-line
        const addressLine = await page.$eval('.address-line', (el) => el.textContent?.trim());

        // get info items
        const infoItems = await page.$$eval('.update-info-item', (items) => {
          const infoItem: { [key: string]: any } = {};
        
          items.forEach((item) => {
            const label = item.querySelector('.pdp_updated-date-label')?.textContent?.trim()
              .toLowerCase()
              .replaceAll(' ', '_')
              .replaceAll('-', '_')
              .replace(/[^a-z0-9_]/g, '');        
            const value = item.querySelector('.pdp_updated-date-value')?.textContent?.trim();
        
            if (label && value) {
              infoItem[label] = value;
            }
          });
        
          return infoItem;
        });

        // get property details
        const propertyDetails = await page.$$eval(DETAILS_XPATH, (details) => {
          const propertyDetail: { [key: string]: any } = {};
        
          details.forEach((detail) => {
            // reguex for removing text in parentheses
            const label = detail.querySelector('.detail-name')?.textContent?.trim()
              .toLowerCase()
              .replaceAll(' ', '_')
              .replaceAll('-', '_')
              .replaceAll('/', '_')
              .replace(/[^a-z0-9_]/g, '');
                  
            const value = detail.querySelector('.detail-value')?.textContent?.trim();
        
            if (label && value) {
              propertyDetail[label] = value;
            }
          });
        
          return propertyDetail;
        });

        // marketing description and investement highlights
        let marketing_desc : string | null | undefined;
        try {
          marketing_desc = await page.$eval('#descriptionCollapsable', (el) => el.textContent?.trim());
          if (!marketing_desc) {
            marketing_desc = '';
          }
        }  catch (err: any) {
          log.warning('No marketing description found');
        }

        // investment highlights
        let inv_highlights : string | null | undefined;
        try {
          inv_highlights = await page.$eval('#investmentHighlightsCollapsable', (el) => el.textContent?.trim());
          if (!inv_highlights) {
            inv_highlights = '';
          }
        }  catch (err: any) {
          log.warning('No investment highlights found');
        }

        // find with locator insights-line-chart__chart
        await page.waitForSelector('.insights-line-chart__chart canvas');
        await page.locator('.insights-line-chart__chart canvas').focus();

        // population
        const population = await page.$eval('.insights-demographics', 
          (el) => el.querySelector('.insights-line-chart__metric-primary')?.textContent?.trim());

        // Household Income and Age Demographics
        const insights = await page.$$eval('.insights-estimate__metric-container', (items) => {
          const insightItem: { [key: string]: any } = {};
        
          items.forEach((item) => {
            const label = item.querySelector('.insights-estimate__metric-label')?.textContent?.trim()
              .toLowerCase()
              .replaceAll(' ', '_')
              .replaceAll('-', '_')
              .replace(/[^a-z0-9_]/g, '');
            const value = item.querySelector('.insights-estimate__metric')?.textContent?.trim();        
        
            if (label && value) {
              insightItem[label] = value;
            }
          });
        
          return insightItem;
        });

        // Employees
        const employees = await page.$eval('.insights-demographics__employees', 
          (el) => el.querySelector('.insights-histogram-horizontal-alt__metric-primary')?.textContent?.trim());

        // Housing Occupancy Ratio
        const housing_occupancy_ratio = await page.$eval('.insights-demographics__housing', 
          (el) => el.querySelector('.insights-ratio__metric-primary')?.textContent?.trim());

        const housing_occupancy_ratio_predicted = await page.$eval('.insights-demographics__housing', 
          (el) => el.querySelector('.insights-ratio__metric-label')?.textContent?.trim());

        // Renter to Homeowner Ratio
        const renter_to_homeowner_ratio = await page.$eval('.insights-demographics__housing-renter-container', 
          (el) => el.querySelector('.insights-ratio__metric-primary')?.textContent?.trim());

        const renter_to_homeowner_ratio_predicted = await page.$eval('.insights-demographics__housing-renter-container', 
          (el) => el.querySelector('.insights-ratio__metric-label')?.textContent?.trim());

        // asking price and deposit
        const offer = await page.$$eval('.term-line', (items) => {
          const offerItem: { [key: string]: any } = {};
        
          items.forEach((item) => {
            const label = item.querySelector('.term-name')?.textContent?.trim().toLowerCase()
              .replaceAll(' ', '_').replaceAll('-', '_').replace(/[^a-z0-9_]/g, '');
            const value = item.querySelector('.term-value')?.textContent?.trim();        
        
            if (label && value) {
              offerItem[label] = value;
            }
          });
        
          return offerItem;
        });

        const property = {
          ...{ url: page.url(), status: 'DONE' },
          ...{ address: addressLine },
          ...infoItems, 
          ...propertyDetails,
          ...{ marketing_description: marketing_desc },
          ...{ investment_highlights: inv_highlights },
          ...{ population },
          ...insights,
          ...{ employees },
          ...{ housing_occupancy_ratio },
          ...{ housing_occupancy_ratio_predicted },
          ...{ renter_to_homeowner_ratio },
          ...{ renter_to_homeowner_ratio_predicted },
          ...offer,
        };
        
        console.log(property);
        await createProperty(property);
      }
    },
    maxRequestsPerCrawl: 3,
    headless: false,
  });

  // await crawler.run(['https://www.crexi.com/properties?occupancyMax=80&occupancyMin=20']);
  await crawler.run(['https://www.crexi.com/properties/1517613/georgia-dahlonega-storage']);
  // await crawler.run(['https://webcache.googleusercontent.com/search?q=cache:https://www.crexi.com/properties/1550508/tennessee-chattanooga-medical-office']);

  console.log('Crawler finished.');
  await closeDatabase();
}

runCrawler().catch(console.error);
