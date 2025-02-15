import { useState, useEffect } from "react";
import { fetchSpreadsheetData, download } from "../scripts/data";
import { FilterCriteria,DataRow, filterBoard, XStateRadio, TrackPage,PlayerPage,DataPage } from "../pages/test";

const tabList = ["Home", "Tracks", "Players", "Leaderboard", "Submit", "Data"];
const ruleSet = "2021 sheet";
const useLocalFile = true;

export default function Home() {
  const [tab, setTab] = useState<string>("Tracks");
  const [data, setData] = useState<DataRow[] | null>(null);
  const [board, setBoard] = useState<DataRow[] | null>(null);
  const [extra, setExtra] = useState<any>(null);
  const [strats, setStrats] = useState<any>(null);
  const [rules, setRules] = useState<any>(null);
  const [filter, setFilter] = useState<FilterCriteria>({});
  
  const ruleData = { extra:extra, strats:strats, rules:rules, ruleSet:ruleSet }
  function changeFilter(newFilter: FilterCriteria) {
    const updatedFilter = { ...filter, ...newFilter };
    filterBoard(data, ruleData, setBoard, updatedFilter);
    setFilter(updatedFilter);
  }
  
  
  useEffect(() => {
    const fetchData = async () => {
      fetchSpreadsheetData("players",useLocalFile);
      setExtra(await fetchSpreadsheetData("extra",useLocalFile));
      setStrats(await fetchSpreadsheetData("strats",useLocalFile));
      setRules(await fetchSpreadsheetData("rules",useLocalFile));
      setData(await fetchSpreadsheetData("times",useLocalFile));
    };
    fetchData();
  }, []);
  
  useEffect(() => {
    if(data && extra && strats && rules)
      changeFilter(filter);
  }, [data, extra, strats, rules]);
  
  
  return (
    <div>
      <div className="content-nav">
        <XStateRadio options={tabList} 
          onClickLogic={(x:any) => {setTab(x);}} 
          defaultOption={"Tracks"}/>
      </div>
      
      <div className="content">
        {
          data == null ? (
            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
              <div className="spinner"/>
              { useLocalFile? "using local file" : "pulling from googlesheets" }
            </div>
        ) :
          <>
            { tab == "Tracks" && TrackPage(board, filter, changeFilter) }
            { tab == "Players" && PlayerPage() }
            { tab == "Data" && DataPage() }
          </>
        }
      </div>
      
      <div className="footer">
        <button style={{ backgroundSize:"cover", 
          backgroundImage: `url('./icons/download.png')` }} 
          onClick={() => download("times")}/>
        <a>data</a><a>src</a><a>cs</a><a>discord</a><a>github</a>
      </div>
      
    </div>
  );
}



