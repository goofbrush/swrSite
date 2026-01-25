const [dataKeyID, apiKey] = ["-", "-"];

let allData: Record<string, { data: any | null; range: string; parse: (data: any) => any }> = {
  times: { data: null, range: "Times!A:T", parse: parseTimes },
  players: { data: null, range: "Player List!A:K", parse: parsePlayers },
  strats: { data: null, range: "Strat Lookup!C:CX", parse: parseStrats },
  extra: { data: null, range: "Extra Data!C2:C", parse: parseExtra },
  rules: { data: null, range: "Rulesets!A:G", parse: parseRules },
};

export function tuah() {
  console.log(getTags(3));
}

export function download(type:"times"|"players"|"strats"|"extra"|"rules") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(allData[type].data, null, 2)], { type: "application/json" }));
  a.download = type+".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseTime(timeString: string): number {
  if(!timeString) return 0;
  
  const [rest, milliseconds] = timeString.split('.');
  var [minutes, seconds] = rest.split(':');
  if(!seconds) { seconds = minutes; minutes = "0"; }

  return (parseInt(minutes) * 60 * 1000) + (parseInt(seconds) * 1000) + parseInt(milliseconds);
}

export async function fetchAll(useLocal = false, update = false) {
  ["times","players","strats","extra","rules"].forEach(key => {
    
  }, {});
}

export async function fetchSpreadsheetData(type:"times"|"players"|"strats"|"extra"|"rules", useLocal = false, update = false) {
  if(allData[type].data && !update) return allData[type].data;
  
  if(useLocal) { 
    const jsonData = await import("../public/data/"+type+".json");
    allData[type].data = jsonData.default || jsonData;
    console.log("fetched: "+type+" from local file");
    return allData[type].data;
  }
  
  const dataURL = `https://sheets.googleapis.com/v4/spreadsheets/${dataKeyID}/values/${allData[type].range}?key=${apiKey}`;
  try {
    const response = await fetch(dataURL);
    const data = await response.json();
    
    allData[type].data = allData[type].parse(data);
  }
  catch (error) { 
    console.error("Failed to fetch data from Google Sheets:", error); 
  }
  
  console.log(allData[type].data);
  console.log("fetched: "+type+" from googlesheets")
  return allData[type].data;
}





function parseTimes(data: any) {
  const [headers, ...rows] = data.values;

  return rows.reduce((result: any[], row: any[]) => {
    if(row[0] == "") return result;
    const obj: Record<string, any> = {};
    
    headers.forEach((header:any, index:any) => {
      obj[header] = row[index] || null;
      
      if (header === "Time") {
        obj["Time_t"] = parseTime(row[index]);
        obj["Position"] = "";
        obj["Position_ws"] = "";
      }
    });
    
    result.push(obj);
    return result;
  }, []) // TODO: Implement a way to tell what is a wr when on the same date. then change sort ^ to just +(a.Date > b.Date)
  .sort((a:any, b:any) => {
    if (a.Date === null) return 1;  // Place null dates at the bottom
    if (b.Date === null) return -1;
    return a.Date > b.Date ? 1 : -1;
  });
}

function parsePlayers(data:any) {
  const [headers, ...rows] = data.values;
  
  return rows.map((row: any[]) => {
    return headers.reduce((obj: Record<string, any>, header: string, index: number) => {
      if(row[0]=="") return obj;
      
      obj[header] = row[index] || null;
      return obj;
    }, {});
  });
}

function parseStrats(data:any) {
  const [tracks, headers, ...rows] = data.values;
  const trackWidth = 4;
  
  return tracks.reduce((acc: Record<string, any>, track: string, trackIndex: number) => {
    if (track=="") return acc;
    acc[track] = {};
    
    rows.forEach((row: any[], rowIndex: number) => {
      if (!row[trackIndex]) return;
      acc[track][Math.pow(2, rowIndex)] = {};
      
      for (let ri = trackIndex; ri < trackIndex + trackWidth; ri++)
        acc[track][Math.pow(2, rowIndex)][headers[ri]] = row[ri];
    });
    
    return acc;
  }, {});
}

function parseExtra(data:any) {
  return data.values.reduce((obj: Record<number, string>, row: any[], index: number) => {
    if (!row[0]) return obj;
    
    obj[Math.pow(2,index)] = row[0];
    return obj;
  }, {});
}

function parseRules(data:any) {
  const [headers, ...rows] = data.values;
  
  return headers.reduce((obj: Record<string, any>, header: string, index: number) => {
    if(header=="") return obj;
    
    obj[header] = rows.reduce((headerObj: Record<string, any>, row: any[]) => {
      if(row[0]=="") return headerObj;
      
      headerObj[row[0]] = row[index];
      return headerObj;
    }, {});
    
    return obj;
  }, {});
}



const getTags = (num: number): string[] => {
  return Object.keys(allData["extra"].data).reduce<string[]>((acc, key) => {
    if (num & +key) acc.push(allData["extra"].data[key]);
    return acc;
  }, []);
};



