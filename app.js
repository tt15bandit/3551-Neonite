// Keep relative data paths inside this folder, regardless of how it is launched.
process.chdir(__dirname);
const sails = require('sails');
const NeoLog = require('./structs/NeoLog');
const { default: axios } = require('axios');
const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');
const version = require('./package.json').version;

function updateBackend() {
  const zip = path.join(__dirname, 'update.zip');
  const temp = path.join(__dirname, 'temp');

  return axios.get(
    'https://raw.githubusercontent.com/HybridFNBR/Neonite/refs/heads/main/package.json',
    { validateStatus: undefined }
  ).then((response) => {

    if (response.status == 200) {

      if (response.data.version > version) {

        NeoLog.Log(
          `Update Available, Any Modified files will be Overrwritten - Downloading Update(Patch: ${response.data.version})`
        );
        const cmd = `powershell -Command " Invoke-WebRequest -Uri 'https://github.com/HybridFNBR/Neonite/archive/refs/heads/main.zip' -OutFile '${zip}'; Expand-Archive -Path '${zip}' -DestinationPath '${temp}' -Force; Copy-Item -Path '${temp}\\*\\*' -Destination '${__dirname}' -Recurse -Force -Exclude 'app.js'; Remove-Item '${zip}' -Force; Remove-Item '${temp}' -Recurse -Force"`;
        try {
          execSync(cmd, { stdio: 'inherit' });

          NeoLog.Log('Installing Packages...');

          execSync('npm install', {
            cwd: __dirname,
            stdio: 'inherit'
          });

          NeoLog.Debug(`Finished Updating to Patch ${response.data.version}`);
        } catch (err) {

          NeoLog.Error(err);

        }
      }
    }
  });
}

async function startBackend() {
  sails.lift({
    port: 3551,
    environment: "production",
    hooks: {
      session: false,
    },
    log: {
      level: 'silent',
    },
  }, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

async function runFunctions() {
  // Automatic upstream updates are disabled to preserve this fork's port 3551 changes.
  await startBackend();
}
runFunctions();
