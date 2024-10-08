import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import axios from "axios";
import Pagination from "@mui/material/Pagination";
import { CircularProgress } from "@mui/material";
import SummaryModal from "./SummaryModal.tsx";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const getOpenAISummary = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Can you provide a summary for the article with the following text: "${text}"?`,
      },
    ],
    max_tokens: 150,
  });

  return response.choices[0].message.content;
};

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalSummary, setModalSummary] = useState("");
  const resultsPerPage = 18;

  const handleSearch = async (event) => {
    setLoading(true);
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/user", {
        searchTerm,
      });
      setResults(response.data);
      setShowResults(true);
      setCurrentPage(1);
      setSummaries({});
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setSearchTerm("");
    setResults([]);
    setSummaries({});
  };

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const extractText = (xmlString) => {
    const regex = /<bcl:text>(.*?)<\/bcl:text>/gs;
    let combinedText = "";
    let match;

    while ((match = regex.exec(xmlString)) !== null) {
      combinedText += match[1].trim() + " ";
    }

    return combinedText.trim();
  };

  const handleSummaryClick = async (xml, index) => {
    try {
      const response = await axios.get(
        "http://localhost:3000/user/proxy/bclaws",
        {
          params: { url: `${xml}` },
        }
      );

      const xmlString = response.data;
      const combinedText = extractText(xmlString);

      if (combinedText) {
        const summary = await getOpenAISummary(combinedText);
        setSummaries((prev) => ({ ...prev, [index]: summary }));
        setModalSummary(summary);
        setOpenModal(true);
      } else {
        setModalSummary(
          "No text was found for this article. Nothing to summarize here"
        );
        setOpenModal(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <Box
      component="form"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        position: "relative",
      }}
      noValidate
      autoComplete="off"
    >
      {showResults && (
        <Button
          sx={{ position: "absolute", top: 16, left: 16 }}
          variant="outlined"
          onClick={handleBack}
        >
          Back
        </Button>
      )}

      {!showResults && !loading ? (
        <>
          <TextField
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2, width: "230px" }}
          />
          <Button type="submit" variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </>
      ) : (
        <Box>
          <ul>
            {!showResults && loading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
                Loading data...
              </Box>
            ) : currentResults.length > 0 ? (
              currentResults.map((result, index) => (
                <li key={index}>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.title}
                  </a>
                  <Button
                    sx={{ marginLeft: 2 }}
                    onClick={() => handleSummaryClick(result.xml, index)}
                  >
                    Summary
                  </Button>
                </li>
              ))
            ) : (
              <p>No results found.</p>
            )}
          </ul>

          <Pagination
            count={Math.ceil(results.length / resultsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            sx={{ mt: 4 }}
          />
        </Box>
      )}

      <SummaryModal
        open={openModal}
        onClose={handleCloseModal}
        summary={modalSummary}
      />
    </Box>
  );
}

export default SearchComponent;
