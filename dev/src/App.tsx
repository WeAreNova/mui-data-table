import MomentUtils from "@date-io/moment";
import {
  Box,
  createTheme,
  CssBaseline,
  FormControlLabel,
  IconButton,
  Switch,
  TableContainer,
  ThemeProvider,
} from "@material-ui/core";
import Brightness4 from "@material-ui/icons/Brightness4";
import Brightness7 from "@material-ui/icons/Brightness7";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
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
    <ThemeProvider theme={createTheme({ palette: { type: darkMode ? "dark" : "light" } })}>
      <CssBaseline />
      <MuiPickersUtilsProvider utils={MomentUtils}>
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
              rowClick={(data: any) => console.log(data)}
              // onEdit={(...data) => "test"}
              exportToCSVOption
              rowsSelectable
              resizeable
            />
          </TableContainer>
        </Box>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  );
}

export default App;
