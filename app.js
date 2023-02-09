const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDB();

const convertPlayerObjToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjToResponseObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchObjToResponseObj = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachArray) => convertPlayerObjToResponseObj(eachArray))
  );
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerObjToResponseObj(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET 
    player_name = '${playerName}' WHERE player_id = ${playerId};`;
  const updatedArray = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchObjToResponseObj(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT match_id, match, year FROM match_details NATURAL JOIN 
  player_match_score WHERE player_id = ${playerId};`;
  const playerMatchArray = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchArray.map((eachArray) => convertMatchObjToResponseObj(eachArray))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `SELECT player_id, player_name
  FROM player_details NATURAL JOIN player_match_score
  WHERE match_id = ${matchId};`;
  const matchPlayerArray = await db.all(getMatchPlayerQuery);
  response.send(
    matchPlayerArray.map((eachArray) =>
      convertPlayerObjToResponseObj(eachArray)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerScoreQuery = `SELECT player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore, 
    SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};`;
  const score = await db.get(getMatchPlayerScoreQuery);
  response.send(score);
});

module.exports = app;
