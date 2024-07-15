import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { createPropertyIfNotExists, saveProperty } from './database.js';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
        log.info(`Processing ${page.url()}`);

        const LIST_XPATH = 'crx-property-tile-aggregate';
        const LINK_XPATH = LIST_XPATH + ' a.cui-card-cover-link';
        const PROPERTY_XPATH = '.details-list';
        const ADDRESS_XPATH = '.property-details-item';

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

            await page.waitForSelector('.post-title');

            // const extractedLinks = await page.$$eval(LINK_XPATH, (anchors) =>
            //     anchors.map((anchor) => anchor.getAttribute('href')?.split('?')[0])
            // );

            const properties = await page.$$eval('.post-title', (cards) =>
                cards.map((card) => ({
                    url: page.url(),
                    title: card.querySelector('.post-title')?.textContent?.trim(),
                    status: 'DONE',
                }))
            );

            // save property details into database
            // for (const property of properties) {
            //     await saveProperty(property);
            // }

            console.log('Crawled Properties:');
            properties.forEach((property, index) => {
                console.log(`Property ${index + 1}:`);
                console.log(`  Title: ${property.title}`);
                console.log('---');
            });            
        }
    },
    maxRequestsPerCrawl: 3,
    headless: false,
});

// await crawler.run(['https://www.crexi.com/properties?occupancyMax=80&occupancyMin=20']);
// await crawler.run(['https://www.crexi.com/properties/1517613/georgia-dahlonega-storage']);
// await crawler.run(['https://webcache.googleusercontent.com/search?q=cache:https://www.crexi.com/properties/1550508/tennessee-chattanooga-medical-office']);
await crawler.run(['https://ferpython.com/numpy-array']);

