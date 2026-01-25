import { useState, useEffect } from "react";
import { fetchSpreadsheetData, download } from "../scripts/data";

import { TrackPage, TrackState } from "../pages/track";
import { PlayerPage, PlayerState } from "../pages/player";
import { LeaderboardPage, LeaderboardState } from "../pages/leaderboard";

import { FilterCriteria, DataRow, filterBoard, getPlayerRecords, XStateRadio } from "./stuff";
import { StatsPage, SimulatorPage } from "./mechanics";

import { useRouter } from "next/router";


const tabList = ["Home", "Tracks", "Players", "Leaderboard", "Submit", "Data"];
const ruleSet = "2021 sheet";
const useLocalFile = true;


export const DataPage = (subTab:any, setSubTab:any) => {
  return(
    <div>
      <XStateRadio value={subTab} 
        options={["Times","Players","Strats","Par Times",
        "Pod Stats","Simulator",
        "Tournament","Botto","Mods",
        "Settings","About"]} onClickLogic={(x:any) => { setSubTab(x) }}
      />
      <hr className="sep"></hr>
      
      <div className="subContent" key={subTab}>
        { subTab == "Simulator" && <SimulatorPage/> }
        { subTab == "Pod Stats" && <StatsPage/> }
      </div>
      
      
    </div>
  )
}


export default function Home() {
  const router = useRouter();
  const tab = (router.query.tab as string) || "Home";
  const setTab = (newTab: string) => {
    router.push(`/?tab=${newTab}`, undefined, { shallow: true });
  };
  
  const [subTab, setSubTab] = useState<string>("Pod Stats");
  
  const [data, setData] = useState<DataRow[] | null>(null);
  const [extra, setExtra] = useState<any>(null);
  const [strats, setStrats] = useState<any>(null);
  const [rules, setRules] = useState<any>(null);
  const [players, setPlayers] = useState<DataRow[] | null>(null);
  const ruleData = { extra:extra, strats:strats, rules:rules, ruleSet:ruleSet }
  
  
  // ────────────────All Page States──────────────
  function pageState<T>( initialState: T ) {
    const [state, setState] = useState<T>(initialState);
    
    const getPlayerRecords2 = () => {
      setState(prev => {
        const records = getPlayerRecords(data);
        return { ...prev, playerRecords: records };
      });
    };
    
    return { ...state, setState, getPlayerRecords2 };
  }
  
  function pageState_TrackBoard<T extends { filter: FilterCriteria }>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    
    const changeFilter = (newFilter: FilterCriteria) => {
      setState(prev => {
        const updated = { ...prev.filter, ...newFilter };
        const newBoard = filterBoard(data, ruleData, updated);
        return { ...prev, filter: updated, board: newBoard };
      });
    };
    
    return { ...state, setState, changeFilter };
  }
  
  
  const trackPageState = pageState_TrackBoard<TrackState>({
    board: null,
    filter: {},
    headerSelect: false,
    dropdownValue: "All",
    triState: "Default",
  });

  const playerPageState = pageState_TrackBoard<PlayerState>({
    board: null,
    filter: { player: "acE", uniquePlayer: false },
    headerSelect: false,
    dropdownValue: "All",
    triState: "Default",
  });
  
  const leaderboardPageState = pageState<LeaderboardState>({
    playerRecords: null
  });
  // ─────────────────────────────────────────────
  
  
  
  
  
  // ─────────────On Start / Tab Change───────────
  useEffect(() => {
    const fetchData = async () => {
      setPlayers(await fetchSpreadsheetData("players",useLocalFile));
      setExtra(await fetchSpreadsheetData("extra",useLocalFile));
      setStrats(await fetchSpreadsheetData("strats",useLocalFile));
      setRules(await fetchSpreadsheetData("rules",useLocalFile));
      setData(await fetchSpreadsheetData("times",useLocalFile));
    };
    fetchData();
  }, []);
  
  useEffect(() => {
    if(data && extra && strats && rules){
      if(tab == "Tracks") trackPageState.changeFilter({});
      else if(tab == "Players") playerPageState.changeFilter({});
    }
  }, [tab, data, extra, strats, rules]);
  // ─────────────────────────────────────────────
  
  
  
  
  
  
  return (
    <div>
      <div className="content-nav">
        <XStateRadio options={tabList} 
          onClickLogic={(x:any) => {setTab(x);}} 
          value={tab}/>
      </div>
      
      <div className="content" key={tab}>
        {
          data == null ? (
            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
              <div className="spinner"/>
              { useLocalFile? "using local file" : "pulling from googlesheets" }
            </div>
        ) :
          <>
            { tab == "Tracks" && <TrackPage state={trackPageState} /> }
            { tab == "Players" && <PlayerPage state={playerPageState} /> }
            { tab == "Leaderboard" && <LeaderboardPage state={leaderboardPageState} /> }
            { tab == "Data" && DataPage(subTab, setSubTab) }
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



