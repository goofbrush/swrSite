import { FilterCriteria, DataRow, tableHeader, XStateRadio, Dropdown, RenderTable, lists, trackList } from "../pages/stuff";

export type TrackState = {
  board: DataRow[] | null;
  filter: FilterCriteria;
  headerSelect: boolean;
  dropdownValue: string;
  triState: string;
};



export default function TrackPage ({ state } : { state: any }) {
  
  const {
    board,
    filter,
    changeFilter,
    headerSelect,
    dropdownValue,
    triState,
    setState,
  } = state;
  
  const obsoleteSelect = ["Unique", "Default", "Obsolete"];
  const consoleSelect = ["All", "Console", "NewGen"];
  
  const obs = obsoleteSelect[2 - +(filter.uniquePlayer || 1) - +(filter.fastestPod || 0)];
  const cons = consoleSelect[filter.platformFilter || 0];
  const lap = filter.laps || "3 lap";
  const ups = (filter.upgrades || "TRUE") == "TRUE"? "Upgrades" : "No Upgrades";
  const trak = filter.track || "BTC";
  // const ft = filter.skips || "Full Track";
  
  const headers : tableHeader[] = [
    { label: "Position", style: { width: "100px", maxWidth: "100px" } },
    { label: "ogPosition", style: { width: "100px", maxWidth: "100px" } },
    { label: "Player", style: { width: "100px", maxWidth: "100px" } },
    { label: "Time", style: { width: "100px", maxWidth: "100px" } },
    { label: "Date", style: { width: "100px", maxWidth: "100px" } },
    { label: "Pod", style: { width: "100px", maxWidth: "100px" } },
    { label: "Platform", style: { width: "100px", maxWidth: "100px" } },
    { label: "Notes", style: { width: "100px", maxWidth: "100px" } },
  ]
  const historyHeaders : tableHeader[] = [
    { label: "Position", style: { width: "50px" } },
    { label: "Player", style: { width: "100px", maxWidth: "100px" } },
    { label: "Time", style: { width: "100px" } },
    { label: "Date", style: { width: "100px" } },
    { label: "Pod", style: { width: "25px", maxWidth: "25px" } },
    { label: "Platform", style: { width: "25px", maxWidth: "25px" } },
    { label: "Notes", style: { width: "25px", maxWidth: "25px" } },
  ]

  const activeHeaders = headerSelect ? historyHeaders : headers;
  
  function disableButton(v:any,type:"skip" | "upgrade" | "lap"):boolean {
    if(!filter.count) return false;
    return filter.count[type][lists[type].indexOf(v)] == 0;
  }
  
  const minDate = new Date("2005-01-01").getTime();
  const maxDate = new Date().getTime();
  
  function changeDate(x:any) {
    const d = new Date( ((maxDate-minDate) * (x.target.value/100))+minDate ).toISOString().split("T")[0];
    changeFilter({date:d});
  }
  function toggleHistory() {
    setState((prev: TrackState) => ({ ...prev, headerSelect: !prev.headerSelect })); 
    changeFilter({history:!filter.history}); 
  }
  
//-----
  //TODO: add # of runs per thingy
  return (
    <div className="trackPage">
      <input
        type="range"
        min="0"
        max="100"
        onChange={(x)=>changeDate(x)}
        defaultValue={100}
      />
      
      <XStateRadio options={obsoleteSelect} value={obs}
        onClickLogic={(x) => { changeFilter({ uniquePlayer: x!="Obsolete", fastestPod: x=="Unique" }); } } />
      
      <XStateRadio options={consoleSelect} value={cons}
        onClickLogic={ (x) => { changeFilter({ platformFilter:consoleSelect.indexOf(x)}); }}/>
      
      <button onClick={() => toggleHistory()} >History</button>
      
      <hr className="sep"></hr>
      
      <div style={{ display: "flex" }}>
        
        <button onClick={()=>{ 
          const selectElement = document.querySelector(".dropdown select") as HTMLSelectElement;
          if (selectElement) {
            selectElement.disabled = !selectElement.disabled;
          }}}>
            Overview
        </button>
        
        <Dropdown options={trackList} changeFilter={changeFilter} defaultOption={trak}/>
        
        
        <XStateRadio options={["Full Track","Skips","AI/MFG Skips"]} onClickLogic={(x) => { changeFilter({ skips: x }); }} 
          disableLogic={(v) => disableButton(v,"skip")} value={"Full Track"}/>
        
        <XStateRadio options={["3 lap", "Fast lap"]} onClickLogic={ (x) => { changeFilter({ laps: x }); } } 
          disableLogic={(v) => disableButton(v,"lap")} value={lap}/>
        
        <XStateRadio options={["Upgrades", "No Upgrades"]} onClickLogic={(x) => { changeFilter({ upgrades: x=="Upgrades"? "TRUE" : "FALSE" }); }} 
          disableLogic={(v) => disableButton(v,"upgrade")}  value={ups}/>
      </div>
      
      <RenderTable table={board} headers={activeHeaders}/>
    </div> 
  );
};