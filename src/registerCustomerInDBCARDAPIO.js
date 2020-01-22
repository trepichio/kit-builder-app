const Firebird = require('node-firebird')
const logger = require('./logger')


var options = {};

// options.host = '127.0.0.1';
options.host = 'localhost';
options.port = 3050;
// options.database = 'C:\\MBD-CARDAPIO\\DB\\ARCOIRIS.fdb';
options.database = 'C:\\MBD\\DB\\ARCOIRIS.FDB';
options.user = 'SYSDBA';
options.password = 'sysdbambd';
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null;            // default
options.pageSize = 4096;        // default when creating database

// const valuesCLIFOR = ['SORVETERIA FERRAZ', '13550693000138', '332084053114', 'EDSON FERRAZ REIS', 'GUARATINGUETA', 'SP', null, 'RUA ALBERTO BARBETA', 47, 'PEDREGULHO', 12515040, 'EDSON', null, '3527207', 307, new Date(), 'E']

// const valuesFIRMA = ['13550693000138', '332084053114', 'EDSON FERRAZ REIS', 'GUARATINGUETA', 'SP', null, 'RUA ALBERTO BARBETA', 47, null, 'PEDREGULHO', 12515040, 'EDSON', null, null]

module.exports = (data) => {

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
    Firebird.attach(options, function (err, db) {

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
          console.log("No results");

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
