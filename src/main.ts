// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset } from 'crawlee';

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ page, log, pushData }) {
        log.info(`Processing ${page.url()}`);

        await page.locator('.tableauPlaceholder').focus();
        log.info('focus on tableau');

        const iframeElement = await page.locator('iframe.tableauViz').elementHandle()
        if (iframeElement == null) {
            log.info('no iframe found')
        } else {
            const f = await iframeElement.contentFrame();
            if (f == null) {
                log.info('iframe has no content')
            } else {
                await f.waitForURL(new RegExp('.*tableau.*', 'i'));
                log.info('frame loaded');
        
                const frame = page.frame('.tableauViz');
                log.info('extractiong from frame');
        
                // Wait for the select box to be visible
                await frame?.waitForSelector(
                    'div.tabComboBoxNameContainer',
                    { state: 'visible' });
                log.info(`Option visible`);
        
                // Click on the select box
                await page.click('div.tabComboBoxNameContainer');
                log.info(`Dropdown clicked`);
        
                // Select an option (adjust the selector as needed)
                await page.selectOption('div.tabComboBoxNameContainer', { value: 'option1' });
                log.info(`Option 1 selected`);
        
                // Wait for 1 second after selecting the option
                await page.waitForTimeout(1000);
        
                // Extract data from the div (adjust the selector as needed)
                const extractedData = await page.$$eval('div.target-class', (elements) =>
                    elements.map((el) => el.textContent)
                );
        
                // Save the extracted data
                await Dataset.pushData({
                    url: page.url(),
                    extractedData,
                });            
            }
            }


        
    },

    maxRequestsPerCrawl: 3,
    headless: false,
});

// Add first URL to the queue and start the crawl.
await crawler.run(['https://www.nar.realtor/research-and-statistics/research-reports/commercial-real-estate-metro-market-reports']);
