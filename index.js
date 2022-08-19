#!/usr/bin/env node
const semver = require('semver');
const fs = require('fs');
const package = require(`${process.cwd()}/package.json`);
const packageLock = require(`${process.cwd()}/package-lock.json`);

const getVersion = () => {
  const patchArg = process.argv.slice(2).find(arg => arg.startsWith('--patch'));
  const minorArg = process.argv.slice(2).find(arg => arg.startsWith('--minor'));
  const majorArg = process.argv.slice(2).find(arg => arg.startsWith('--major'));
  const versionSpecifiedArg = process.argv.slice(2).find(arg => arg.startsWith('version='));

  if (versionSpecifiedArg) {
    const version = versionSpecifiedArg.split('=')[1];
   
    if (!semver.valid(version)) {
      console.log('Invalid version specified');
      process.exit(1);
    }

    return version;
  }

  if (patchArg || minorArg || majorArg) {
    const incrementType = patchArg ? 'patch' : minorArg ? 'minor' : 'major';
    return semver.inc(package.version, incrementType);
  }

  console.log('No version specified');
  process.exit(1);
}

const changeVersion = (version) => {
  
  try {
    package.version = version;
    packageLock.version = version;

    // Write new version to package.json
    fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(package, null, 2));
  
    // Write new version to package-lock.json
    fs.writeFileSync(`${process.cwd()}/package-lock.json`, JSON.stringify(packageLock, null, 2));
  } catch (error) {
    console.error('Error writing new version to package.json or package-lock.json, either files do not exist or are not writable');
  }
  
  // Modify version in ./helm/values/values.yaml
  try {
    const valuesYaml = fs.readFileSync(`${process.cwd()}/helm/values/values.yaml`, 'utf8');
    const newValuesYaml = valuesYaml.replace(/version:.*/, `version: ${version}`);
    fs.writeFileSync(`${process.cwd()}/helm/values/values.yaml`, newValuesYaml);
  } catch (error) {
    console.error('Error writing to ./helm/values/values.yaml, either file does not exist or is not writable');
  }

  console.log('Version bumped to', version);
}

const start = () => {
  const version = getVersion();
  if (version) {
    changeVersion(version);
  }
}

start()