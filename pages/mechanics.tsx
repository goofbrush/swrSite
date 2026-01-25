import { useState, useEffect } from "react";
import { XStateRadio } from "./stuff";
import Scrollbars from "react-custom-scrollbars-2";
import { clear } from "console";

function upgrade(part:string, lv:number, health:number, baseStat:number) {
  if(lv==0) return baseStat
  var r = baseStat;
  const h = health/255;
  
  if(part=="antiskid") r = Math.min(baseStat + ((lv*0.05)*h), 1)
  if(part=="turn_response") r = lv == 5? baseStat + ((4*116 + 114)*h) : baseStat + ((lv*116)*h)
  if(part=="acceleration") r = baseStat * (1 - (lv*0.14*h))
  if(part=="max_speed") r = Math.min(baseStat + ((lv*40)*h), 650)
  if(part=="air_brake_interval") r = baseStat * (1-(0.08 + 0.09*(lv-1))*h)
  if(part=="cool_rate") r = baseStat + ((lv*1.6)*h)
  if(part=="repair_rate") r = lv == 5? baseStat + (((4*0.1) + 0.05)*h): baseStat + ((lv*0.1)*h)
  return Math.round(r*100)/100
}

export const StatsPage = () => {
  const [jsonData, setJsonData] = useState<any>(null);
  const [lv, setLv] = useState<any>(5);
  const [health, setHealth] = useState<any>(255);

  useEffect(() => {
    const fetchData = async () => {
      const data = await import("../public/data/pod_stats.json");
      setJsonData(data.default || data);
    };
    fetchData();
  }, []);
  
  const headers = ["Pod","antiskid", "turn_response", "acceleration", "max_speed", "air_brake_interval", "cool_rate", "repair_rate", 
    "max_turn_rate", "deceleration_interval", "boost_thrust", "heat_rate", "isect_radius", "hover_height", "bump_mass", "damage_immunity"]
  
  return(
    <div>
      <div style={{ display: "flex", alignItems:"center", paddingBottom:"10px" }}>
        <XStateRadio value={lv} options={["0","1","2","3","4","5"]} onClickLogic={(x:any)=>{setLv(x)}}/>
        <input
          type="range"
          defaultValue={255}
          value={health}
          min="0"
          max="255"
          step="1"
          style={{width:130, margin:10}}
          onChange={(x)=>{setHealth(x.target.value)}}
          onWheel={(e)=>{setHealth(Math.min(Math.max(parseInt(health) + (e.deltaY>0?-1:1),0),255))}}
        />
        <input 
          type="number"
          defaultValue={255}
          value={health}
          min="0"
          max="255"
          step="1"
          style={{width:"45px", height:"100%", color:"white", backgroundColor:"#282840", marginRight:"5px"}}
          onChange={(x)=>{setHealth(x.target.value)}}
        />
        <div style={{width:"41px", textAlign:"right"}}>{Math.floor(health/255 * 100)}%</div>
        <XStateRadio options={["40%","50%","60%","70%","80%","90%"]} noActives={true} onClickLogic={(x:any)=>{setHealth(Math.ceil(parseInt(x)*2.55))}}/>
      </div>
      
      
      { jsonData && 
      
      <table style={{textAlign:"center"}}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th style={{backgroundImage:`url('/swrSite/symbols/${header}.png')`, backgroundSize:"cover" ,width:42, maxWidth:42, height:42}} key={header}></th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          <>
          {(()=> {
            const valueMap: Record<string, Record<any, any>> = {};
            const ranges: Record<string, { min: number; max: number }> = {};
            
            headers.map(header => { 
              if(header=="Pod") return;
              
              Object.entries(jsonData).map(([racer, stats]:any) => {
                const val = upgrade(header, lv, health, stats[header]);
                valueMap[racer] = valueMap[racer] ?? {};
                valueMap[racer][header] = val;
                
                if (!ranges[header]) ranges[header] = { min: Infinity, max: -Infinity };
                if (val < ranges[header].min) ranges[header].min = val;
                if (val > ranges[header].max) ranges[header].max = val;
              });
            });
            
            return Object.entries(jsonData).map(([racer, stats]:any) => {
              return <tr> {racer}
                {headers.map(header => {
                  if(header=="Pod") return;
                  
                  const value = valueMap[racer][header];
                  const percent = ranges[header].max == ranges[header].min? 100 : (value - ranges[header].min) / (ranges[header].max - ranges[header].min) *100;
                  const percent2 = ["acceleration", "air_brake_interval", "deceleration_interval", "heat_rate", "damage_immunity"].includes(header)? 100-percent : percent;
                  
                  return (
                    <td
                      key={header}
                      style={{
                        width: 42,
                        maxWidth: 42,
                        color: `color-mix(in srgb,#6d55e5 ${100-percent2}%,#e85c57 ${percent2}%)`
                      }}
                    > {value}
                    </td>
                  );
                })}
              </tr>
            });
          })()}
          </>
        </tbody>
        
      </table>
      }
    </div>
  )
}

export const SimulatorPage = () => {
  
  const parts = ["Traction", "Turning", "Accel", "Speed", "Brake", "Cooling", "Repair"]
  const [partUpgraded, setpartUpgraded] = useState<any>([false,false,false,false,false,false,false]);
  const [partHealth, setpartHealth] = useState<any>([255,255,255,255,255,255,255]);
  
  const [pitdroids, setPitDroids] = useState<number>(1);
  const [damage, setDamage] = useState<number>(0.0);
  
  function bruteforce(trials:number) {
    var dmg = [0,0,0,0,0,0,0];
    
    for(var i=0;i<trials;i++) {
      const d = damageParts(partHealth);
      for(var j=0;j<7;j++) {
        dmg[j] += d[j];
      }
    }
    for(var j=0;j<7;j++) {
      dmg[j] /= trials;
    }
    return dmg;
    // var t = 0.0;
    // for(var i=0;i<trials;i++) {
    //   var d = 1530;
    //   var r = Math.floor(Math.random() * 52) + 26;
    //   while(d>r) {
    //     d-=r;
    //     r = Math.floor(Math.random() * 52) + 26;
    //   }
    //   t+=d;
    // }
    // return t/trials;
    
  }
  function computeExpectedFinalX(maxX: number): number {
    const f: number[] = new Array(maxX + 1).fill(0);
    for (let x = 0; x <= maxX; x++) {
      let total = 0;
      for (let r = 26; r <= 77; r++) {
        if (r >= x) {
          total += x;
        } else {
          total += f[x - r];
        }
      }
      f[x] = total / 52;
    }
    return f[maxX];
  }
  function computeAverageSteps(maxX: number): number {
    const f: number[] = new Array(maxX + 1).fill(0);
    
    for (let x = 0; x <= maxX; x++) {
      let total = 0;
      for (let r = 26; r <= 77; r++) {
        if (r < x) {
          total += 1 + f[x - r];
        }
      }
      f[x] = total / 52;
    }
    return f[maxX];
  }
  function computeAverageDamage(maxX: number): number {
    const f: number[] = new Array(maxX + 1).fill(0);
    
    for (let x = 0; x <= maxX; x++) {
      let total = 0;
      for (let r = 26; r <= 77; r++) {
        if (r < x) {
          total += 1 + f[x - r];
        }
      }
      f[x] = total / 52;
    }
    return f[maxX];
  }
  
  const cache = new Map<string, number>();
  function calcPartHealth(health: number, damagePool: number): number {
    const key = `${health},${damagePool}`;
    if (cache.has(key)) return cache.get(key)!;
    
    if (damagePool <= 26) return health;
    let expectedValue = 0;
    let count = 0;
    
    for (let RNG = 26; RNG < Math.min(78, damagePool); RNG++) {
      const nextHealth = health > RNG ? health - RNG : 0;
      const nextPool = damagePool - RNG;
      
      const valueDamaged = calcPartHealth(nextHealth, nextPool);
      const valueUnchanged = calcPartHealth(health, nextPool);
      
      expectedValue += valueDamaged + 6 * valueUnchanged;
      count += 7;
    }
    
    const result = expectedValue / count;
    cache.set(key, result); 
    return result;
  }
  
  function probability() {
    const prob = document.getElementById("prob");
    if(!prob) return;
    
    const bfDamage = bruteforce(1);
    const hej = calcPartHealth(255,1530);
    
    // 1 stat
    // damage step
    
    // const damagePool = Math.min(Math.floor(damage*255), 1530);
    // const numUps = partUpgraded.reduce((a:number, b:boolean) => a + Number(b));
    
    // const avgRoll = (26+77)/2; // 51.5
    // const avgSteps = computeAverageSteps(damagePool);
    // const ff = 255-expectedTotalDamage(damagePool/7,255);
    
    // const avgValidRoll = 0;
    
    // const avgHits = avgSteps * 1/7;
    // const avgDamage = 255-(avgHits * avgRoll);

    // prob.innerText = "avgSteps: " + avgSteps + "\navgHits: " + avgHits + "\navgDmg: " + avgDamage + "\nbfDmg: " + a;
    prob.innerText = "bruteforce: " + bfDamage[0] + "\nprob: " + hej;
  }
  
  function clearTable(tableName:string) {
    const table = document.getElementById(tableName);
    if(table) table.innerHTML = "";
  }
  function addRow(tableName:string, rowData:any, partIndex:number=Infinity, modified:boolean=false) {
    const table = document.getElementById(tableName);
    if(!table) return;
    // if(partIndex==Infinity) clearTable(tableName);
    
    const row = document.createElement("tr");
    row.className = partIndex == Infinity ? "Last" : "";
    rowData.forEach((val:any,i:number) => {
      const cell = document.createElement("td");
      cell.textContent = String(val);
      cell.className = (i==partIndex+2? "Selected" + (modified?" Cell"+tableName:"") :"");
      row.appendChild(cell);
    });
    table.appendChild(row);
  }
  
  
  function damageParts(p:any) {
    clearTable("damage");
    
    var damagePool = Math.min(Math.floor(damage*255), 1530);
    var damageRoll = Math.floor(Math.random() * 52) + 26;
    p = p.map((x:any,i:number) => partUpgraded[i]?parseInt(x):255); // Set damaged stock parts to max
    
    var s = 0;
    while(damagePool > damageRoll) {
      const partSelect = Math.floor(Math.random()*7);
      const validDamage = !partUpgraded[partSelect] ? 0 : Math.min(p[partSelect],damageRoll);
      
      p[partSelect] -= validDamage;
      
      // addRow("damage",[damagePool, damageRoll].concat(p), partSelect, validDamage>0);
      if(partSelect==0)s++;
      damagePool -= damageRoll; // doesnt care if partial damage is taken (validDamage)
      damageRoll = Math.floor(Math.random() * 52) + 26; // min 26 - max 77
    }
    
    addRow("damage",[damagePool, damageRoll].concat(p)); // Final Row
    const partDamage = 1785 - p.reduce((a:number, b:number) => a + b);
    
    // repairParts(p,partDamage);
    return p;
  }
  function repairParts(p:any, damageAccrued:number) {
    clearTable("repair"); clearTable("repairText");
    
    var repairPool = pitdroids*255;
    var repairRoll = Math.floor(Math.random() * 52) + 27;
    
    if(repairPool >= damageAccrued) { // Pitdroid 1:1 guarantee
      p = p.map((_:any)=>255);
      const t = document.getElementById("repairText");
      t&&(t.innerText = "Repair Pool covers Part Damage\n"+repairPool+" >= "+damageAccrued);
      return;
    }
    while(repairPool > repairRoll) {
      const partSelect = Math.floor(Math.random() * 7);
      const partDamage = 255 - p[partSelect];
      const prevPool = repairPool;
      
      if(partDamage > 0) {
        if(partDamage >= repairRoll) { 
          p[partSelect] += repairRoll;
          repairPool -= repairRoll;
        }
        else {
          const overflow = (p[partSelect] + repairRoll) - 255
          p[partSelect] = 255;
          repairPool -= overflow; // Bug in original code, it should -partDamage instead
        }
      }
      
      addRow("repair",[prevPool, repairRoll].concat(p), partSelect, partDamage>0);
      repairRoll = Math.floor(Math.random() * 52) + 27; // min 27 - max 77
    }
    
    addRow("repair",[repairPool, repairRoll].concat(p)); // Final Row
  }
  
  
  function partTable() {
    return (
      <table>
        <thead>
          <tr> {parts.map((part) => (
            <th>{part}</th>
          ))} </tr>
        </thead>
        
        <tbody>
          <tr> {parts.map((_,i)=> ( <td> <input value={partUpgraded[i]} style={{appearance:"checkbox",height:"20px"}} type="checkbox" onChange={(x)=>{const u=[...partUpgraded]; u[i]=!u[i]; setpartUpgraded(u);}}/></td> ))} </tr>
          <tr> {parts.map((_,i)=> ( <td><input value={partHealth[i]} type="number" min={0} max={255} defaultValue={255} onChange={(x)=>{const h = [...partHealth]; h[i]=x.target.value;setpartHealth(h)}}/></td> ))} </tr>
          <tr> {parts.map((_,i)=> ( <td>{Math.floor(partHealth[i]/2.55)}%</td> ))} </tr>
        </tbody>
      </table>
    )
  }
  
  return(
    <div className="Simulator">
      <table>
        <tr> {parts.map((part) => ( <th>{part}</th> ))} </tr>
        <tr> {parts.map((_,i)=> ( <td> <input value={partUpgraded[i]} style={{appearance:"checkbox",height:"20px"}} type="checkbox" onChange={(x)=>{const u=[...partUpgraded]; u[i]=!u[i]; setpartUpgraded(u);}}/></td> ))} </tr>
        <tr> {parts.map((_,i)=> ( <td><input value={partHealth[i]} type="number" min={0} max={255} defaultValue={255} onChange={(x)=>{const h = [...partHealth]; h[i]=x.target.value;setpartHealth(h)}}/></td> ))} </tr>
        <tr> {parts.map((_,i)=> ( <td>{Math.floor(partHealth[i]/2.55)}%</td> ))} </tr>
      </table>
      
      <div style={{display:"flex"}}>
        <table style={{border:"1px solid grey", padding:10, marginBottom:10}}>
          <th colSpan={parts.length}><button style={{width:"100%"}} onClick={()=>{probability()}}>Roll RNG</button></th>
          <tr> 
            <td>PitDroids</td>
            <td style={{alignItems:"center",display:"flex"}}>
              <input type="number" min={1} max={4} defaultValue={1} onChange={(x)=>{setPitDroids(parseInt(x.target.value))}}/>
              <div style={{}}>{pitdroids*255}</div>
            </td>
          </tr>
          <tr> 
            <td>Damage(/s)</td> 
            <td style={{alignItems:"center",display:"flex"}}>
              <input type="number" min={0.0} max={6.0} step={0.01} defaultValue={0.0} onChange={(x)=>{setDamage(parseFloat(x.target.value))}}/> 
              <div style={{}}>{Math.min(Math.floor(damage*255),1530)}</div>
            </td>
          </tr>
        </table>
        
        <div>
          Damage Pool:
          Repair Pool:
          
          Min Part Damage:
          Max Part Damage:
          Average Part Damage:
          Sim Part Damage:
        </div>
      </div>
      
      
      <div style={{display:"flex"}}>
        <Scrollbars className="simTable stRed">
          <table id="damage"/>
        </Scrollbars>
        
        <Scrollbars className="simTable stGreen">
          <table id="repair"/>
          <div id="repairText"/>
        </Scrollbars>
      </div>
      
      <div id="prob"></div>
    </div>
  )
}



export default function M() {  return null; }