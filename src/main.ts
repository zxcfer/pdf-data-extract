import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { connectToDatabase, closeDatabase, 
  createProperty, updateProperty } from './mongodb.js';

async function runCrawler() {
  await connectToDatabase();

  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
      log.info(`Processing ${page.url()}`);

      // 1: check if logged in
      const SAVE_XPATH = 'crx-save-link';
    
      // get text of save button
      const saveButton = await page.$(SAVE_XPATH);
      const saveText = await saveButton?.evaluate((button) => button.textContent?.trim());
      log.info(`Save button: ${saveText}`);

      // if not logged in, login
      if (saveText?.includes('Save')) {
        log.info('Logging in...');

        const LOGIN_XPATH = 'crx-login-link';
        const EMAIL_XPATH = 'crx-email-input';
        const PASSWORD_XPATH = 'crx-password-input';
        const SUBMIT_XPATH = 'crx-login-button';

        // click on login button
        await page.click(`.${LOGIN_XPATH}`);
      }
      
      // 2: click on sign up/login button
      // 2.1: click on login button
      // 3: fill in the form
      // 4: submit form
      // 5: wait for login to complete
      // 6: go to the page

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

        const PROPERTY_XPATH = '#property-details';
        const DETAILS_XPATH = '.property-details-item';

        await page.waitForSelector(PROPERTY_XPATH);

        const propertyDetails = await page.$$eval(DETAILS_XPATH, (details) => {
          const propertyDetail: { [key: string]: any } = {};
        
          details.forEach((detail) => {
            // reguex for removing text in parentheses
            const label = detail.querySelector('.detail-name')?.textContent?.trim()
              .toLowerCase()
              .replace(' ', '_')
              .replace('-', '_')
              .replace(/[^a-z0-9_]/g, '');
                  
            const value = detail.querySelector('.detail-value')?.textContent?.trim()
              .replace('$', '')
              .replace(',', '')
              .replace('%', '');
        
            if (label && value) {
              propertyDetail[label] = value;
            }
          });
        
          return propertyDetail;
        });

        const property = {...{ url: page.url(), status: 'DONE' }, ...propertyDetails};
        
        console.log(property);
        await createProperty(property);
      }
    },
    maxRequestsPerCrawl: 3,
    headless: false,
  });

  // await crawler.run(['https://www.crexi.com/properties?occupancyMax=80&occupancyMin=20']);
  // await crawler.run(['https://www.crexi.com/properties/1517613/georgia-dahlonega-storage']);
  await crawler.run(['https://webcache.googleusercontent.com/search?q=cache:https://www.crexi.com/properties/1550508/tennessee-chattanooga-medical-office']);
  // await crawler.run(['https://ferpython.com/numpy-array']);

  console.log('Crawler finished.');
  await closeDatabase();
}

runCrawler().catch(console.error);
