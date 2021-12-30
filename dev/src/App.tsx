import Brightness4 from "@mui/icons-material/Brightness4";
import Brightness7 from "@mui/icons-material/Brightness7";
// import { LocalizationProvider } from "@mui/lab";
// import MomentAdapter from "@mui/lab/AdapterMoment";
import {
  Box,
  createTheme,
  CssBaseline,
  FormControlLabel,
  IconButton,
  Switch,
  TableContainer,
  ThemeProvider,
} from "@mui/material";
import DataTable, { setDefaultCurrency } from "@wearenova/mui-data-table";
import React, { useCallback, useEffect, useState } from "react";
import { getData, STRUCTURE, User } from "./utils";

setDefaultCurrency("USD");

function App() {
  const [darkMode, setDarkMode] = useState(window.localStorage.getItem("darkMode") === "true");
  const [changeServerSide, setChangeServerSide] = useState(false);
  const [data, setData] = useState<User[]>([]);

  const toggleDarkMode = useCallback(() => setDarkMode((currDarkMode) => !currDarkMode), []);
  const toggleChangeServerSide = useCallback(
    () => setChangeServerSide((currChangeServerSide) => !currChangeServerSide),
    [],
  );

  useEffect(() => {
    window.localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleChange = useCallback(async () => {
    const res = await getData();
    setData(res);
    return res;
  }, []);

  useEffect(() => {
    handleChange();
  }, [handleChange]);

  return (
    <ThemeProvider theme={createTheme({ palette: { mode: darkMode ? "dark" : "light" } })}>
      <CssBaseline />
      {/* <LocalizationProvider dateAdapter={MomentAdapter}> */}
      <Box display="flex" justifyContent="flex-end" marginBottom={2} paddingRight={1} paddingTop={1}>
        <IconButton onClick={toggleDarkMode}>{darkMode ? <Brightness7 /> : <Brightness4 />}</IconButton>
        <FormControlLabel
          control={<Switch checked={changeServerSide} onChange={toggleChangeServerSide} />}
          label="simulate server-side change handling?"
        />
      </Box>
      <Box>
        <TableContainer>
          <DataTable
            tableData={data}
            tableStructure={STRUCTURE}
            onChange={changeServerSide ? handleChange : undefined}
            rowClick={(data) => console.log(data)}
            // onEdit={(...data) => "test"}
            exportToCSVOption
            resizeable
          />
        </TableContainer>
      </Box>
      {/* </LocalizationProvider> */}
    </ThemeProvider>
  );
}

export default App;
