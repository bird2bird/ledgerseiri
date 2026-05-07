#!/usr/bin/env node
"use strict";

// Step122-O compatibility wrapper.
// The project has moved from Step122-K blocked-route semantics to Step122-O readonly controller semantics.
// This wrapper keeps historical smoke commands useful without preserving obsolete "no service call / blocked error" assertions.

const { runCompatSmoke } = require("./smoke-amazon-sp-api-sandbox-importjob-read-model-readonly-compat-guard");

runCompatSmoke('Step122-H legacy controller contract regression')
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  });
