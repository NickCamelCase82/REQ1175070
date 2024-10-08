const axios = require("axios");
const xml2js = require("xml2js");

class UserController {
  async search(req, res) {
    const baseUrl = `https://www.bclaws.gov.bc.ca/civix/search/complete/fullsearch`;
    let s = 0; // Start index
    const e = 30; // Number of results per batch
    let hasMoreResults = true;

    let results: { title: string; url: string; xml: string }[] = [];

    const { searchTerm } = req.body;

    while (hasMoreResults) {
      const url = `${baseUrl}?p=${searchTerm}&ancestor=complete&aspOrInd=aspect&q=CIVIX_DOCUMENT_ROOT_STEM%3A%28${searchTerm}%29&s=${s}&e=${
        s + e
      }&nFrag=5&lFrag=100& xsl=%2Ftemplates%2FsearchResults.xsl`;

      try {
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        const documents = result.results.doc;
        if (documents && documents.length > 0) {
          documents.forEach((doc) => {
            results.push({
              title: doc.CIVIX_DOCUMENT_TITLE[0],
              url: `https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/${doc.CIVIX_DOCUMENT_ID[0]}`, // We need this to render document's name and redirect to it if needed
              xml: `https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/${doc.CIVIX_DOCUMENT_ID[0]}/xml`, // We need this to extract the text and serve it to OpenAI for a summary
            });
          });
          s += e; // Move to the next batch of results
        } else {
          hasMoreResults = false; // Stop if no more results are returned
        }
      } catch (error) {
        return res.status(500).json({ error: "Error fetching search results" });
      }
    }
    return res.json(results);
  }

  async fetchXml(req, res) {
    const { url } = req.query;
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0", // Pretending to be a client side as BC Laws web-page is sometimes denying server-side calls
        },
      });
      res.set("Content-Type", response.headers["content-type"]);
      res.send(response.data);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch data from BC Laws." });
    }
  }
}

module.exports = new UserController();
