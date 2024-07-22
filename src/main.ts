import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { connectToDatabase, closeDatabase, getPendingProperties,
  createProperty, updateProperty } from './mongodb.js';

async function runCrawler() {
  await connectToDatabase();

  const starting_url = 'https://www.crexi.com/properties?occupancyMax=80&occupancyMin=20';
  const base_url = new URL(starting_url).origin;

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

        const username = process.env.WEB_USERNAME;
        const password = process.env.WEB_PASSWORD;

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

        // reloading page to get updated data and cotinue crawl
        await page.reload();
      }

      log.info('Crawling...');

      const LIST_XPATH = 'crx-property-tile-aggregate';
      const LINK_XPATH = LIST_XPATH + ' a.cui-card-cover-link';

      if (page.url().includes('/properties?')) {
        log.info(`Extracting PAGE links`);

        await page.waitForSelector(LIST_XPATH);

        // get property links
        const extractedLinks = await page.$$eval(LINK_XPATH, (anchors) =>
          anchors.map((anchor) => anchor.getAttribute('href')?.split('?')[0])
        );

        for (const link of extractedLinks) {
          log.info(`Analyzing link: ${link}`);

          if (link?.includes('/properties/')) {
            log.info(`Property link detected: ${link}`);

            // save Property links into database
            const property = await createProperty({
              url: link,
              status: 'PENDING',
            });

            // queue Property link
            if (property) {
              const queue = await RequestQueue.open();
              await queue.addRequest({ url: base_url + link });  
            }
          } else {
            log.info(`Not a property link: ${link}`);
          }
        }

        // get page links
        const pageLinks = await page.$$eval('li.page a', (anchors) =>
          anchors.map((anchor) => anchor.getAttribute('href'))
        );

        for (const link of pageLinks) {
          if (link?.includes('/properties?')) {
            const newUrl = starting_url + '&page=' + link.split('page=')[1];
            const queue = await RequestQueue.open();
            await queue.addRequest({ url: newUrl });
            log.info(`Page link queued: ${link}`);
          } else {
            log.info(`Not a page link: ${link}`);
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

        let population_insights : { [key: string]: any } = {population: ''};
        try {
          // await page.locator('.insights-demographics').scrollIntoViewIfNeeded();
          await page.getByText('Population').scrollIntoViewIfNeeded();
          await page.mouse.wheel(0, 10);
          log.info('Scrolled to population');  

          // population
          await page.waitForSelector('.insights-line-chart__chart canvas');
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
          
          population_insights = {
            ...{ population },
            ...insights,
            ...{ employees },
            ...{ housing_occupancy_ratio },
            ...{ housing_occupancy_ratio_predicted },
            ...{ renter_to_homeowner_ratio },
            ...{ renter_to_homeowner_ratio_predicted },
          };

        } catch (err: any) {
          log.warning('No population found');
        }

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

        const current_url = page.url().replace(base_url, '').split('?')[0];
        const property = {
          ...{ url: current_url, status: 'DONE' },
          ...{ address: addressLine },
          ...infoItems, 
          ...propertyDetails,
          ...{ marketing_description: marketing_desc },
          ...{ investment_highlights: inv_highlights },
          ...population_insights,
          ...offer,
        };

        console.log(property);

        const result = await updateProperty(property);
        console.log(`${result.matchedCount} matched | ${result.modifiedCount} updated`);
      }
    },
    maxRequestsPerCrawl: 300,
    maxConcurrency: 1,
    headless: false,
  });

  // get PENDING properties from mongodb
  const properties = await getPendingProperties();

  // put all properties urls into an array
  const propertyUrls = properties.map((property) => base_url + property.url);
  if (propertyUrls.length > 0) {
    await crawler.run(propertyUrls);
  }
  
  await crawler.run([starting_url]);
  
  console.log('Crawler finished.');
  await closeDatabase();
}

runCrawler().catch(console.error);
