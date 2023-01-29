const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost: 3001");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const getAllStates = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

//GET list of all states API

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
            SELECT *
            FROM state;`;
  const allStatesArray = await db.all(getAllStatesQuery);
  response.send(allStatesArray.map((state) => getAllStates(state)));
});

//GET single state API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(getAllStates(state));
});

//POST new district to the district table API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetailsQuery = `
        INSERT INTO 
            district(district_name, state_id, cases, cured, active, deaths)
        VALUES(
            "${districtName}",
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});`;
  const dbresponse = await db.run(addDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//GET single district API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * 
        FROM district
        WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send({
    districtId: district["district_id"],
    districtName: district["district_name"],
    stateId: district["state_id"],
    cases: district["cases"],
    cured: district["cured"],
    active: district["active"],
    deaths: district["deaths"],
  });
});

//DELETE district API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE 
        FROM district
        WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//PUT update district API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtNewDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtNewDetails;

  const updateDistrictQuery = `
    UPDATE 
        district
    SET 
        district_name = "${districtName}",
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET statistics of cases based on state API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCasesOfStateQuery = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM district    
        WHERE 
            state_id = ${stateId};`;
  const stateReport = await db.get(getCasesOfStateQuery);
  console.log(stateReport);
  response.send({
    totalCases: stateReport["SUM(cases)"],
    totalCured: stateReport["SUM(cured)"],
    totalActive: stateReport["SUM(active)"],
    totalDeaths: stateReport["SUM(deaths)"],
  });
});

module.exports = app;

//GET state id based on district API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
        SELECT 
            state_name
        FROM 
            district NATURAL JOIN state
        WHERE 
            district_id = ${districtId};`;
  const state = await db.get(getStateQuery);
  response.send({
    stateName: state.state_name,
  });
});
