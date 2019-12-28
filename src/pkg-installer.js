const { exec } = require('pkg')
const path = require('path')
const sendEmail = require('./ethereal')

const main = async () => {
  const kitInstaller = path.resolve('..', '..', 'kit-installer', 'package.json')
  const cliente = 'CLIENTE'
  const kitName = 'SIAC'
  const kitVersion = 'v19.09.30-4488'
  const now = new Date().toLocaleDateString()
  const kitDestination = path.resolve('..', '..', '..', 'KITS', cliente)
  console.log("TCL: main -> kitDestination", kitDestination)

  console.log("TCL: kitInstaller", kitInstaller)

  try {
    await exec([kitInstaller, '--target', 'host', '--output', `${kitDestination}\\kit-${cliente}-${kitName}-${kitVersion}-cr-${now}.exe`])

    // do something with app.exe, run, test, upload, deploy, etc
    sendEmail({ cliente, kitName, kitVersion, now, kitDestination })
  } catch (error) {

    console.log(error);
  }

}

main()