import MomentUtils from "@date-io/moment";
import { Box, createTheme, CssBaseline, IconButton, TableContainer, ThemeProvider } from "@material-ui/core";
import Brightness4 from "@material-ui/icons/Brightness4";
import Brightness7 from "@material-ui/icons/Brightness7";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import React, { useCallback, useEffect, useState } from "react";
import Table from "./lib";

function App() {
  const [darkMode, setDarkMode] = useState(window.localStorage.getItem("darkMode") === "true");
  const toggleDarkMode = useCallback(() => setDarkMode((currDarkMode) => !currDarkMode), []);
  useEffect(() => {
    window.localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <ThemeProvider theme={createTheme({ palette: { type: darkMode ? "dark" : "light" } })}>
      <CssBaseline />
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <Box display="flex" justifyContent="flex-end" marginBottom={2} paddingRight={1} paddingTop={1}>
          <IconButton onClick={toggleDarkMode}>{darkMode ? <Brightness7 /> : <Brightness4 />}</IconButton>
        </Box>
        <TableContainer>
          <Table tableData={[]} tableStructure={[]} />
        </TableContainer>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  );
}

export default App;
