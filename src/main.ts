import { PlaywrightCrawler, Dataset } from 'crawlee';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, enqueueLinks, log }) {
        log.info(`Processing ${page.url()}`);

        // choose property or list page type
        if (page.url().includes('properties')) {
            // list page type
            log.info(`Extracting page links`);

            await enqueueLinks({
                selector: 'crx-property-tile-aggregate a.cui-card-cover-link',
                baseUrl: new URL(page.url()).origin,
            });
            
            await enqueueLinks({
                selector: 'crx-pager-alt a',
                baseUrl: new URL(page.url()).origin,
            });
        } else {
            // property details
            log.info('Extracting property details');

            await page.waitForSelector('.property-info-container');

            // Extract data from the page
            const properties = await page.$$eval('.property-info-container', (cards) =>
                cards.map((card) => ({
                    title: card.querySelector('.address-line')?.textContent?.trim(),
                }))
            );
    
            // Save the data to the default dataset
            // await Dataset.pushData(properties);
    
            console.log('Crawled Properties:');
            properties.forEach((property, index) => {
                console.log(`Property ${index + 1}:`);
                console.log(`  Title: ${property.title}`);
                console.log('---');
            });
            
            // // Extract property data
            // const properties = await page.$$eval('.property-card', (cards) =>
            //     cards.map((card) => ({
            //         title: card.querySelector('.property-title')?.textContent?.trim() || '',
            //         price: card.querySelector('.property-price')?.textContent?.trim() || '',
            //         location: card.querySelector('.property-location')?.textContent?.trim() || '',
            //         type: card.querySelector('.property-type')?.textContent?.trim() || '',
            //         size: card.querySelector('.property-size')?.textContent?.trim() || '',
            //     }))
            // );

            // Save properties to the database
            // for (const property of properties) {
            //     await savePropertyToDB(property);
            // }
        }
    },
    maxRequestsPerCrawl: 3,
    headless: false,
});

await crawler.run(['https://www.crexi.com/properties?occupancyMax=63&occupancyMin=22']);
