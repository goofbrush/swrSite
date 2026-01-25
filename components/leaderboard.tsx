import { FilterCriteria, DataRow, tableHeader, XStateRadio, Dropdown, RenderTable, lists, trackList } from "../pages/stuff";

export type LeaderboardState = {
  playerRecords: DataRow[] | null;
};



export default function LeaderboardPage ({ state } : { state: any }) {
  
  const {
    playerRecords,
    getPlayerRecords2,
    setState,
  } = state;
  
  const rows = Array.from({ length: 25 }, () =>
    Array.from({ length: 8 }, (_, i) =>
      i % 2 === 0
        ? Math.floor(Math.random() * 4) + 1
        : `0:${(50 + Math.floor(Math.random() * 10))
            .toString()
            .padStart(2, "0")}.${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`
    )
  );
  
  return (
    <div style={{display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"1rem"}}>
      
      <button onClick={() => getPlayerRecords2()}>History</button>
      
      <div className="card">
        <div className="card-header">
          <h2>Leaderboard</h2>
        </div>
        
        <div className="card-body">
          <table className="data-table">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        
        <div className="card-footer">
          <span>Showing top 25 results</span>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2>Leaderboard</h2>
        </div>
        
        <div className="card-body">
          <table className="data-table">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        
        <div className="card-footer">
          <span>Showing top 25 results</span>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Leaderboard</h2>
        </div>
        
        <div className="card-body">
          <table className="data-table">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        
        <div className="card-footer">
          <span>Showing top 25 results</span>
        </div>
      </div>

    </div>
  );
};

