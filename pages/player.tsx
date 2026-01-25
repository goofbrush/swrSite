import { FilterCriteria, DataRow, tableHeader, XStateRadio, Dropdown, RenderTable, lists, trackList } from "./stuff";

export type PlayerState = {
  board: DataRow[] | null;
  filter: FilterCriteria;
  headerSelect: boolean;
  dropdownValue: string;
  triState: string;
};



export default function PlayerPage ({ state } : { state: any }) {
  
  const {
    board,
    filter,
    changeFilter,
    headerSelect,
    dropdownValue,
    triState,
    setState,
  } = state;
  
  const headers : tableHeader[] = [
    { label: "ogPosition", style: { width: "50px" } },
    { label: "Time", style: { width: "100px" } },
    { label: "Date", style: { width: "100px" } },
    { label: "Pod", style: { width: "25px", maxWidth: "25px" } },
    { label: "Platform", style: { width: "25px", maxWidth: "25px" } },
    { label: "Notes", style: { width: "25px", maxWidth: "25px" } },
  ]
  
  return (
    <div>
      {/* <Dropdown options={players.data} changeFilter={changeFilter} defaultOption={"goofbrush"}/> */}
      <button onClick={() => changeFilter({history:!filter.history})}>History</button>
      <RenderTable table={board} headers={headers}/>
    </div>
  );
};