import MomentUtils from "@date-io/moment";
import { CssBaseline, TableContainer } from "@material-ui/core";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import React from "react";
import Table from "./lib";

function App() {
  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <CssBaseline />
      <TableContainer>
        <Table tableData={[]} tableStructure={[]} />
      </TableContainer>
    </MuiPickersUtilsProvider>
  );
}

export default App;
