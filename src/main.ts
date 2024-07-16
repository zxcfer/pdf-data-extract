import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { createPropertyIfNotExists, Property, saveProperty } from './database.js';
import { keys } from 'ts-transformer-keys';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
        log.info(`Processing ${page.url()}`);

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
                    const property = await createPropertyIfNotExists({
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
                const fields = ['fer'];
                const propertyDetail: { [key: string]: any } = {};
            
                details.forEach((detail) => {
                    // reguex for removing text in parentheses
                    const re = /\(.*?\)/g;
                    const label = detail.querySelector('.detail-name')?.textContent?.trim()
                        .toLowerCase()
                        .replace(' ', '_')
                        .replace('-', '_')
                        .replace(re, '')
                        .replace(/[^a-z0-9_]/g, '');
                                
                    const value = detail.querySelector('.detail-value')?.textContent?.trim()
                        .replace('$', '')
                        .replace(',', '')
                        .replace('%', '')
                        .replace(/[^a-zA-Z0-9.]/g, '');
            
                    if (label && value) {
                        if (fields.includes(label)) {
                            propertyDetail[label] = value;
                        }
                    }
                });
            
                return propertyDetail;
            });

            console.log(propertyDetails);

            // combine Property with propertyDetails
            const property = {...{ url: page.url(), status: 'DONE' }, ...propertyDetails};

            console.log(property);

            // save property
            await saveProperty(property);
        }
    },
    maxRequestsPerCrawl: 3,
    headless: false,
});

// await crawler.run(['https://www.crexi.com/properties?occupancyMax=80&occupancyMin=20']);
// await crawler.run(['https://www.crexi.com/properties/1517613/georgia-dahlonega-storage']);
await crawler.run(['https://webcache.googleusercontent.com/search?q=cache:https://www.crexi.com/properties/1550508/tennessee-chattanooga-medical-office']);
// await crawler.run(['https://ferpython.com/numpy-array']);

