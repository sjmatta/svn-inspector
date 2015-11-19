const url = 'https://vcs.dtec.com/svn/';
const username = 'bugzilla';
const password = 'password1!';
const options = {
  url: 'https://vcs.dtec.com/svn/',
  strictSSL: false,
  auth: {
    'user': username,
    'password': password,
  },
};

const Promise = require('bluebird');
const request = Promise.promisify(require('request').get, { multiArgs: true });
const exec = Promise.promisify(require('child_process').exec);
const parseString = Promise.promisify(require('xml2js').parseString);
const _ = require('lodash');

request(options)
  .then(result => require('cheerio').load(result[1]))
  .then($ => Promise.map($('a').get(), repo => {
    const repoName = $(repo).text().replace('/', '');
    return exec('svn info ' + url + repoName + ' --xml')
      .then(result => parseString(result))
      .then(result => {
        const entry = result.info.entry[0];
        return {
          name: repoName,
          author: entry.commit[0].author,
          date: entry.commit[0].date,
        };
      });
  }))
  .then(result => Promise.each(result.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())), repo => {
    const date = new Date(repo.date);
    const niceDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    console.log('[' + repo.name + '] ' + repo.author + ' - ' + niceDate);
  }));
