import { Promise } from 'bluebird'
import _ from 'lodash'
import { Observable } from 'rxjs/Rx'
import { mergeMap, map } from 'rxjs/operators'
import puppeteer from 'puppeteer'



export default (question, answers) => {
  return Observable.forkJoin(
    ..._.map(answers, (answer) => (
      Observable.from(getResults(question, answer))
    ))).map(results => {
      return transfromResults(results)
    })
}

let getResults =  async (question, answer) => {
  // TODO remove this when doing it live
  return { answer: answer, count: 0 }
  let queryUrl = `https://www.google.com/search?q=${question} ${answer}`
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const resultsSelector = '#resultStats'
  await page.waitForSelector(resultsSelector)

  // Extract the results from the page.
  let count = await page.evaluate(resultsSelector => {
    return document.querySelector(resultsSelector).innerHTML
  }, resultsSelector)

  count = count
    .split(' ')[1]
    .replace(/,/g,'')

  // TODO stop closing browser, save it's connection for later
  browser.close();
  return { answer: answer, count: count }
};

let transfromResults = (results) => {
  results.sort((a,b) => {
    a = parseInt(a.count)
    b = parseInt(b.count)
    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  })

  // check if count is 0
  results = _.map(results, (result) => {
    if (result.count == 0) return { ...result, count: 1 }
    return result
  })

  let sum = _.reduce(results, (val, ele) => (val + parseInt(ele.count)), 0)

  let final = {
    smallest: { answer: results[0].answer, weight: results[0].count/sum },
    middle: { answer: results[1].answer, weight: results[1].count/sum },
    largest: { answer: results[results.length-1].answer, weight: results[results.length-1].count/sum },
    method: 'numberOfGoogleResults',
  }
  return final
}
