const Firebird = require("node-firebird");
const logger = require("./logger");
const config = require("config");
const path = require("path");
const canAccess = require("./helpers/canAccess");

module.exports = async data => {
  const {
    ["driverLetter"]: defaultDriverLetter,
    ["dirRootName"]: defaultRootDir
  } = config.get("Builder").builderConfig;
  const defaultInstallPath = path.join(defaultDriverLetter, defaultRootDir);
  logger.info(`TCL: defaultInstallPath ${defaultInstallPath}`);

  const { dateCreated, driverLetter, rootDir, kitName } = data;
  const installPath = path.join(driverLetter, rootDir);
  logger.info(`TCL: installPath ${installPath}`);

  if (installPath == defaultInstallPath) return;

  const { dbExts, dbNames, dbPath } = config.get("Builder").dbConfig;
  var dbOptions = config.util.toObject(config.get("Builder").dbConfig.options);

  for (const extension of dbExts) {
    let databaseFile = `${dbPath}\\${dbNames[data.kitName][0]}${extension}`;
    if (await canAccess(databaseFile)) {
      dbOptions.database = databaseFile;
      console.log("TCL: options.database", dbOptions.database);
      break;
    }
  }

  // const opt = { year: "numeric", month: "numeric", day: "numeric" };

  // const requestTime = new Date(dateCreated).toLocaleString("pt-br", opt);
  // logger.info(`TCL: requestTime ${requestTime}`);

  const paramsNeedInstallPath = [
    "CAMINHOESQUEMA",
    "DIRXMLRECEBIDO",
    "NFE_CAMINHOTEMP",
    "DIRFASTREPORT",
    "DIRFASTREPORTFRENTE",
    "DIRFASTREPORTPREVENDA",
    "DIRFASTREPORTSIACCRED",
    "DIRFASTREPORTCOMUM",
    "CAMINHO_SCHEMA_NFCE",
    "CAMINHO_INTEGRACAO",
    "CTE_CAMINHOESQUEMA"
  ];

  const paramsDataVigor = ["DATAVIGORCEST", "DATAVIGORCESTNCM"];

  var table = "PARAMETROS";
  var params = [];
  var values = [];

  //select, replace and update
  const valuesParamsNeedInstallPath = await selectDB(
    table,
    paramsNeedInstallPath
  );
  if (!valuesParamsNeedInstallPath)
    throw `Cannot continue the task without getting the values of ${paramsNeedInstallPath} from ${table}`;

  const newParamsInstallPathValues = valuesParamsNeedInstallPath.map(v =>
    v.replace(defaultInstallPath, installPath)
  );

  const updatedInstallValues = await updateDB(
    table,
    paramsNeedInstallPath,
    newParamsInstallPathValues
  );
  if (!updatedInstallValues)
    throw `Cannot continue the task without updating the values of ${paramsNeedInstallPath} in ${table}`;

  const DataVigorCEST = new Date(2020, 6, 1);
  const newParamsDataVigorValues = [DataVigorCEST, DataVigorCEST];
  const updatedDataVigorValues = await updateDB(
    table,
    paramsDataVigor,
    newParamsDataVigorValues
  );
  if (!updatedDataVigorValues)
    throw `Cannot continue the task without updating the values of ${paramsDataVigor} in ${table}`;

  /**
 *

 return new Promise((resolve, reject) => {
   logger.info("Attaching Firebird");
   Firebird.attach(dbOptions, function(err, db) {
     if (err) throw err;
      logger.info(`Retrieving data from ${table}`);
      const query = `SELECT ${paramsNeedInstallPath.join(",")} FROM ${table}`;
      db.query(query, async function(err, result) {
        if (err) throw err;

        logger.info(`Result of ${table}: ${JSON.stringify(result)}`);
        if (result !== undefined && result.length > 0) {
          for (const field in result[0]) {
            logger.info(`${field}, ${result[0][field]}`);
            let value = result[0][field].toString("utf8");

            value = value.replace(defaultInstallPath, installPath);
            params = [...params, `${field}=?`];
            values = [...values, value];
            // }
          }

          const query = `UPDATE ${table} SET ${params.join(",")}`;
          logger.info(`TCL: query ${query}`);

          try {
            logger.info(
              await new Promise((resv, rej) => {
                db.query(query, values, function(err, res) {
                  err
                    ? rej(err)
                    : resv(
                      `updated ${values.map(v =>
                          v ? v.toString("binary") : v
                          )}  @${table}: `,
                        res
                      );
                  // db.detach();
                });
              })
            );
          } catch (error) {
            logger.error(error);
            reject(true);
          } finally {
            db.detach();
            resolve(true);
          }

          // db.detach();
          // resolve(true);
        } else {
          logger.info("No results");
          logger.error(
            `There was an error trying to fetch register from table ${table} of ${kitName}.`
            );
          db.detach();
          resolve(true);
        }
      });
    });
  });
   */

  async function updateDB(table, params, values) {
    if (!Array.isArray(params)) params = [params];

    params = params.map(p => `${p}=?`);

    return new Promise((resolve, reject) => {
      logger.info("Attaching Firebird");
      Firebird.attach(dbOptions, async function(err, db) {
        if (err) throw err;

        const query = `UPDATE ${table} SET ${params.join(",")}`;
        logger.info(`TCL: query ${query}`);

        try {
          logger.info(
            await new Promise((resv, rej) => {
              db.query(query, values, function(err, res) {
                err
                  ? rej(err)
                  : resv(
                      `updated ${values.map(v =>
                        v ? v.toString("binary") : v
                      )}  @${table}: `,
                      res
                    );
                // db.detach();
              });
            })
          );
          resolve(true);
        } catch (error) {
          logger.error(error);
          reject(error);
        } finally {
          db.detach();
          // resolve(true);
        }
      });
    });
  }

  async function selectDB(table, params = "*") {
    return new Promise((resolve, reject) => {
      logger.info("Attaching Firebird");
      Firebird.attach(dbOptions, function(err, db) {
        if (err) throw err;

        logger.info(`Retrieving data from ${table}`);
        const query = `SELECT ${params.join(",")} FROM ${table}`;
        db.query(query, async function(err, result) {
          if (err) throw err;

          logger.info(`Result of ${table}: ${JSON.stringify(result)}`);
          if (result !== undefined && result.length > 0) {
            for (i = 0; i < result.length; i++) {
              for (const field in result[i]) {
                logger.info(`${field}, ${result[i][field]}`);
                let value = result[i][field].toString("utf8");

                // const param = paramsNeedInstallPath.find(field);
                // logger.info(`TCL: param ${param}`);
                // if (param) {
                values = [...values, value];
                // }
              }
              resolve(values);
            }
          } else {
            logger.info("No results");
            logger.error(
              `There was an error trying to fetch register from table ${table} of ${kitName}.`
            );
            db.detach();
            reject(`No results from ${query}`);
          }
        });
      });
    });
  }
};
