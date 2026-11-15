import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,retries:0,
 reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
 outputDir:'test-results',
 use:{baseURL:process.env.E2E_WEB_URL||'http://127.0.0.1:3000',channel:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure',viewport:{width:1440,height:1000}},
});
