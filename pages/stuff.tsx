import { useState, useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import ReactPlayer from "react-player";
import { FixedSizeList as List } from "react-window";
import Scrollbars from "react-custom-scrollbars-2";

export type DataRow = { [key: string]: any };
export type tableHeader = {label: string; style: React.CSSProperties;}

type CountAccumulator = {
  skip: [number, number, number];
  upgrade: [number, number];
  lap: [number, number];
};

export interface FilterCriteria {
  player?: string | null;
  history?: boolean | null;
  
  track?: string | null;
  laps?: string | null;
  
  skips?: string | null;
  upgrades?: string | null;
  
  date?: string | Date | null;
  
  uniquePlayer?: boolean | null;
  fastestPod?: boolean | null;
  platformFilter?: number | null;
  
  count?: CountAccumulator;
}

export const lists = {
  "skip": ["Full Track", "Skips", "AI/MFG Skips"],
  "upgrade": ["Upgrades", "No Upgrades"],
  "lap": ["3 lap", "Fast lap"]
}
export const trackList = ["BTC","MGS","BWR","AQC","M100","VEN","SMR","SC","HG","DD","SR","ZC","BC","BB","EXE","SL","GVG","AMR","DR","FMR","BEC","APC","ABY","TGT","INF"];


const platformMap: { [key: string]: number } = { "PC": 0, "N64":1, "Dreamcast":1, "Switch":2, "Xbox One":2, "PS4":2 }; 

//TODO:

// wr breakdown, like circumark. +obsolete

// show quick board stats, # of runs / obsolete / wrs
// popup to show big track details, casual details, pod fave etc
// wr progression
// show pos when set
// overview tab to show table of best runs based on all switches
// pod list to remove pods from table, or select certain ones
// limit pod list to +x obsolete, so eg a player can only show up x times with different pods

// quick custom rulesets
// add savestate flap and ai/mfg (when combined) markers
// show date delta on hover
// pos flags
// player flags
// run details on popup
// ui colour change per track
// better table colours
// dark icons on table

// transition table changes
// transition tab changes

// timeline scrubber colour coded by # of runs
// table sort options
// show exact date
// some way to more granually go through timeline
// when selecting a new tab go to the first run in timeline if no results
// option to disable this
// mayyybe auto select skip/lap/up option when selecting empty board with toggle to disable function

// set focus for player
// focus shows all obsolete then makes rows that arent player focused small in height and have ... or some symbol to represent text
// graph user position over time?
// hover element for position to show graph of the performance of that run over time

// action over date to set the table date filter to that date
// toggle to show delta from wr, in obsolete mode also show delta from pb

function getRunData(Data:any, Run:any) {
  const [extra,strats,rules,ruleSet] = [Data.extra,Data.strats,Data.rules,Data.ruleSet];
  const [track,sNumber,eNumber] = [Run.Track,Run["Strats Data"],Run["Extra Data"]];
  
  const extraData = Object.keys(extra).reduce<string[]>((acc, key) => {
    if (eNumber & +key) acc.push(extra[key]);
    return acc;
  }, []);
  
  const stratData = sNumber < 0? [] :
    Object.keys(strats[track]).reduce<string[]>((acc, key) => {
      if (sNumber & +key) acc.push(strats[track][key].Name);
      return acc;
    }, []);
  
  var [ruling, ruling2] = rules[ruleSet][track.toLowerCase()].split(",")
    .map((num:string) => (sNumber>0 && +num & sNumber)? true:false);
  ruling = sNumber==-1? true: ruling;
  ruling2 = sNumber==-2? true: ruling2;
  
  const eRuling = +rules[ruleSet]["general"] & eNumber ? true:false;
  
  const b = { sRule:ruling, s2Rule:ruling2 || false, eRule:eRuling, sData: stratData, eData: extraData }
  return b;
}

export function filterBoard(Data: DataRow[] | null, ruleData:any, newFilter: FilterCriteria): (DataRow[] | null) {
  
  if(!Data) return null;
  console.time("filter board");
  
  const player = newFilter.player ?? null;
  const history = newFilter.history ?? false;
  
  const track= newFilter.track ?? "BTC";
  const laps= newFilter.laps ?? "3 lap";
  const skips= newFilter.skips ?? "Full Track";
  const upgrades= newFilter.upgrades ?? "TRUE";
  const date= newFilter.date ?? new Date();
  const uniquePlayer= newFilter.uniquePlayer ?? true;
  const fastestPod= newFilter.fastestPod ?? false;
  const platformFilter= newFilter.platformFilter ?? 0;
  
  // assumes data is in chronological order
  // TODO: change unqiue player to obsoletedTimes and fastestPod to unique player
  
  // Tracks the number of runs in different switches
  const counters: CountAccumulator = {
    skip: [0, 0, 0],
    upgrade: [0, 0],
    lap: [0, 0]
  };
  
  
  const playerChangelog:any = {};
  const leaderboard:any = [];
  var prevBestTime = Infinity;
  
  // keeps a running leaderboard, and returns a list of bopped runs to update
  function updateLeaderboard(run:any) {
    var insertIndex = -1;
    
    for(let i = 0; i < leaderboard.length + 1; i++) {
      const item = leaderboard[i]; // invalid item = insert new player at the end
      
      // Position in leaderboard reached
      if( !item || ((insertIndex == -1) && (run.Time_t < item.Time_t))) {
        leaderboard.splice(i, 0, run);
        insertIndex = i + 1;
        
        run.ogPosition = run.Position = insertIndex;
        if(playerChangelog[run.Player]) continue;
        
        // new player found
        playerChangelog[run.Player] = [{Date:run.Date, Position:insertIndex}]; 
        return leaderboard.slice(insertIndex); // update the pos of the players behind
      }
      
      if(run.Player == item.Player) {
        if(run.Time_t > item.Time_t) { // time was never faster
          run.ogPosition = run.Position = "-";
          return []; // dont have to do anything
        }
        item.Position = "-"; // time became obsolete
        playerChangelog[item.Player].push({Date:run.Date, Position:insertIndex});
        
        leaderboard.splice(i,1); // remove obsolete time //TODO: return nothing if no pos change
        return leaderboard.slice(insertIndex,i); // update the pos of the players behind
      }
    }
  }
  
  const filtered = Data.filter(run => {
  // 1st filter
    if(run.Track != track) return false;
    if(run.Date > date) return false;
    if(!run.Date) return false;
    
    
    if( (platformMap[run.Platform] < platformFilter)
      || (platformFilter!=0 && run.Platform==null) ) 
    { return false; }
    
    
  // set variable data | TODO: optimise or only run this with a flag
    run.runData = getRunData(ruleData,run);
    run.skipType = run.runData.s2Rule ? 2 : run.runData.sRule ? 1 : 0;
    
    
  // counting # of runs with different variables
    if (run.skipType == lists["skip"].indexOf(skips)) {
      if (run.Laps == laps)
        counters.upgrade[+(run.Upgrades !== "TRUE")]++;
      
      if (run.Upgrades == upgrades) 
        counters.lap[+(run.Laps !== "3 lap")]++;
    }
    if (run.Laps == laps && run.Upgrades == upgrades) 
      counters.skip[run.skipType]++;
    
    
  // 2nd filter
    
    if(run.Laps != laps) return false;
    if(run.Upgrades != upgrades) return false;
    if(run.skipType != lists["skip"].indexOf(skips)) return false;
    
    
  // update running leaderboard
    const boppedRuns = updateLeaderboard(run);
    
    boppedRuns.forEach((item:any) => {
      item.Position++;
      playerChangelog[item.Player].push({Date:run.Date, Position:item.Position});
    });
    
    if(player && run.Player != player) return false;
    if(history) {
      if(run.Time_t < prevBestTime) {
        prevBestTime = run.Time_t;
        return true;
      }
      return false;
    }
    
    
    return true;
  }).sort((a, b) => { return a.Time_t - b.Time_t; });
  
  newFilter.count = counters;
  
  
  
  
  const playerList:any = {}
  
  const output = filtered.filter(run => {
    const newPlayer = !playerList[run.Player];
  
    if(newPlayer) {
      playerList[run.Player] = {}; // TODO: add platform to this also
    }
  
    // check for pod when fastestPod is true, otherwise check if player exists
    const exists = playerList[run.Player][run.Platform+run.Pod] 
      || (!newPlayer && (run.Platform == null || run.Pod == null))
      || (fastestPod && !newPlayer);
  
    // [filters obsolete] modes: one per player | one per player+pod | show all obsolete
    if(!exists) 
      playerList[run.Player][run.Platform+run.Pod] = true;
    else if(uniquePlayer && history == false)
      return false; 
  
    return true;
  });
  
  
  // setBoard(output);
  console.timeEnd("filter board");
  return output;
}



export function getPlayerRecords(Data: DataRow[] | null): (string) {
  
  // tracks | laps | skips
  
  const ranks = Object.fromEntries(
    trackList.map(track => [
      track, {
        "full track": { "3 lap": {}, "fast lap": {} },
        "skips": { "3 lap": {}, "fast lap": {} }
      }
    ])
  );
  
  console.log("h");
  return "H";
}






const VideoTabs = ({ urls }: { urls: string }) => {
  if(!urls) return null;
  
  const videoLinks = urls.split(",").map((url, i) => [i, url.trim().split("&list")[0]]);
  
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <div className="video-tabs">
      <XStateRadio options={videoLinks.map(u=>String(u[0]))} 
        onClickLogic={(x)=> setActiveIndex(Number(x))}/>
      
      <div className="video-container">
        <ReactPlayer url={String(videoLinks[activeIndex][1])} controls width="640px" height="480px" />
      </div>
    </div>
  );
};


const showPopup = (run: any) => {
  const container = document.body.appendChild(document.createElement('div'));
  const root = ReactDOM.createRoot(container);
  
  root.render(
    <div className="popupBackdrop" 
    onClick={() => {root.unmount(); container.remove();}}>
      <div className="popupContent" onClick={e => e.stopPropagation()}>
        <h2>{run.Player} - {run.Track} - {run.Laps} - {run.Time}</h2>
        
        <VideoTabs urls={run["Video Link"]}/>
        Notes: {run.Notes}
      </div>
    </div>
  );
}


function calculateDaysAgo(dateString :string):number {
  console.log("h");
  const date = new Date(dateString);
  const today = new Date();
  const diffInTime = today.getTime() - date.getTime();
  return Math.floor(diffInTime / (1000 * 60 * 60 * 24));
}

const hoverElement = (run:any) => {
  if(!run["Notes"]) return null;
  const [isHovered, setIsHovered] = useState(false);

  return(
    <div style={{height:"100%",backgroundImage: `url('./icons/note.png')`}}
    className="hoverParent" onMouseEnter={()=>setIsHovered(true)}
    onMouseLeave={()=>setIsHovered(false)} >
      
      {run["Notes"]}
      
      {isHovered && <div className="hoverChild">
        {run["Notes"]}
        {/* <ul>
          {run["runData"]["sData"].map((item:any) => (
            <li>{item}</li>
          ))}
        </ul> */}
      </div>}
      
    </div>
    
  );
}


export function XStateRadio({ options, onClickLogic, disableLogic = () => false, value = null, noActives = false }
  : { options: string[], onClickLogic: (value: string) => void, 
    disableLogic?: (value: string) => boolean, 
    value?: string | null 
    noActives?: boolean | false}) {
  
  const activeButton = value || options[0];
  
  useEffect(() => {
    if (disableLogic(activeButton)) {
      //setActiveButton(options[0]);
      //TODO: set filter
    }
  }, [disableLogic, options]);
  
  return (
    <div className="stateButtons">
      {options.map((option, index) => (
        
        <button
          value={option}
          disabled={disableLogic(option)}
          className={`${index == 0 ? "left" : index == options.length - 1 ? "right" : "center"} ${activeButton == option && !noActives ? "active" : ""}`}
          onClick={() => onClickLogic(option)}
        >
          
          {option}
        </button>
      ))}
    </div>
  );
}

export function Dropdown({options, changeFilter, defaultOption}
  : {options:string[], changeFilter: any, defaultOption: string} ) {
  
  return (
    <div className="dropdown">
      <select onChange={(e) => { changeFilter({track:e.target.value}) } } defaultValue={defaultOption}>
        {options.map((option) => (
          <option value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}



export function RenderTable ({table, headers} 
  : {table:DataRow | null, headers :tableHeader[]}) {
  
  if (!table || !Array.isArray(table)) return null;
  
  const rowSize = 25;
  const [listHeight, setListHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);
  
  useEffect(() => {
    const size = Math.min(table.length * rowSize, Math.max(250,windowHeight - 385));
    setListHeight(size);
  }, [table.length, windowHeight]);
  
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const row = table[index];
    return (
      <tr
        key={index} style={style}
        className={row["Position"] === "-" ? "obsolete" : ""}
        onClick={() => showPopup(row)}
      >
        {headers.map((header) => (
          <td
            key={header.label}
            style={
              
              header.label == "Platform"
              ? { backgroundImage: `url('./plat/${row[header.label]}.png')` }
              : header.label == "Pod"
              ? { backgroundImage: `url('./pod/${row[header.label]}.png')` }
              : header.style
            }
            className={header.label == "Player" ? "style-" + row[header.label] : header.label} 
          >
            {header.label=="Notes"?hoverElement(row):row[header.label]}
          </td>
        ))}
      </tr>
    );
  };
  
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr className="header">
            {headers.map((header) => (
              <th key={header.label} style={header.style}>{header.label === "Position" || header.label === "ogPosition" ? "#" : header.label}</th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="table-body vList">
        <List overscanCount={1} outerElementType={CustomScrollbars} height={listHeight} itemSize={rowSize} itemCount={table.length} width="100%">
          { Row }
        </List>
      </div>
    </div>
  );
};



type CustomScrollbarsProps = {
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
  children: React.ReactNode;
};
const CustomScrollbars = React.forwardRef<Scrollbars, CustomScrollbarsProps>(({ onScroll, style, children }, ref) => (
  <Scrollbars style={{ ...style, overflow: "hidden" }} onScroll={onScroll} ref={ref}>
    {children}
  </Scrollbars>
));





















export default function T() {  return null; }