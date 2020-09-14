const Firebird = require('node-firebird')
const logger = require('./logger')
const config = require('config')
const canAccess = require('./helpers/canAccess')



// const valuesCLIFOR = ['SORVETERIA FERRAZ', '13550693000138', '332084053114', 'EDSON FERRAZ REIS', 'GUARATINGUETA', 'SP', null, 'RUA ALBERTO BARBETA', 47, 'PEDREGULHO', 12515040, 'EDSON', null, '3527207', 307, new Date(), 'E']

// const valuesFIRMA = ['13550693000138', '332084053114', 'EDSON FERRAZ REIS', 'GUARATINGUETA', 'SP', null, 'RUA ALBERTO BARBETA', 47, null, 'PEDREGULHO', 12515040, 'EDSON', null, null]

module.exports = async (data) => {
  const { dbExts, dbNames, dbPath } = config.get('Builder').dbConfig
  var dbOptions = config.util.toObject(config.get('Builder').dbConfig.options)

  // var options = {};

  // options.host = '127.0.0.1';
  // options.host = 'localhost';
  // options.port = 3050;
  // options.database = '';
  // options.user = 'SYSDBA';
  // options.password = 'sysdbambd';
  // options.lowercase_keys = false; // set to true to lowercase keys
  // options.role = null;            // default
  // options.pageSize = 4096;        // default when creating database

  for (const extension of dbExts) {
    let databaseFile = `${dbPath}\\${dbNames[data.kitName][0]}${extension}`;
    if (await canAccess(databaseFile)) {
      dbOptions.database = databaseFile;
      break;
    }
  }

  const { dateCreated } = data

  const opt = { year: 'numeric', month: 'numeric', day: 'numeric' };

  // const requestTime = Date.now()
  const requestTime = new Date(dateCreated).toLocaleString('pt-br', opt)
  logger.info(`TCL: requestTime ${requestTime}`)

  const tipoCliFor = 'E'

  const { CNPJ, IE, ["RAZAO SOCIAL"]: RAZAO_SOCIAL, CIDADE, UF, FAX, ENDERECO, N, COMPLEMENTO, BAIRRO, CEP, CONTATO, TELEFONE, IM, FANTASIA, IBGE, MUNICIPIO_ID } = data.CustomerRegistration

  const valuesFIRMA = [CNPJ, IE, RAZAO_SOCIAL, CIDADE, UF, FAX, ENDERECO, N, COMPLEMENTO, BAIRRO, CEP, CONTATO, TELEFONE, IM]

  const valuesCLIFOR = [FANTASIA, CNPJ, IE, RAZAO_SOCIAL, CIDADE, UF, FAX, ENDERECO, N, BAIRRO, CEP, CONTATO, TELEFONE, IBGE, MUNICIPIO_ID, requestTime, tipoCliFor]

  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, function (err, db) {

      if (err)
        throw err;

      db.query('SELECT * FROM FIRMA', async function (err, result) {
        if (err)
          throw err;
        // IF THERE IS A CUSTOMER ALREADY REGISTERED
        if (result != undefined && result[0].CNPJ !== null && result[0].CNPJ.toString('latin1') !== '0') {

          //WHAT CUSTOMER IS IT?
          for (i = 0; i < result.length; i++) {
            for (const field in result[i]) {
              (result[i][field] === null || typeof result[i][field] === 'number') ? console.log(field, result[i][field]) : console.log(field, result[i][field].toString('latin1'))
            }
          }
          db.detach();
          resolve(true)

        }
        else {
          logger.info("No results");

          try {
            //OK. It's a clean database, let's register the customer info
            logger.info(await new Promise((resv, rej) => {
              db.query('UPDATE FIRMA SET CNPJ=?, IE=?, RAZAO_SOCIAL=?, MUNICIPIO=?, UF=?, FAX=?, LOGRADOURO=?, NUMERO=?, COMPLEMENTO=?, BAIRRO=?, CEP=?, CONTATO=?, TELEFONE=?, IM=?', valuesFIRMA, function (err, res) {
                // err ? console.log(err) : console.log(`inserted ${valuesFIRMA} @FIRMA: `, res);
                err ? rej(err) : resv(`inserted ${valuesFIRMA} @FIRMA: `, res);
                // db.detach();
              });
            }))

            logger.info(await new Promise((resv, rej) => {

              db.query('UPDATE CLIFOR SET NOMEFANTASIA=?, CNPJ=?, IE=?, RAZAOSOCIAL=?, CIDADE=?, UF=?, FAX=?, ENDERECO=?, NUMEROCASA=?, BAIRRO=?, CEP=?, CONTATO=?, TELEFONE=?, COD_IBGE_CIDADE=?, MUN_CODIGO_ID=?, DTCADASTRO=? WHERE TIPOCLIFOR=?', valuesCLIFOR, function (err, res) {
                err ? rej(err) : resv(`inserted ${valuesCLIFOR} @CLIFOR: `, res);
                // db.detach();
              });
            }))

          } catch (error) {
            console.log(error);
            reject(error)
          }
          finally {
            db.detach();
            resolve(true)
          }

        }
      })

    });
  })

}
