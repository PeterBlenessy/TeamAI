# Sync Process Documentation

This document outlines the synchronization process implemented in the project.

## Overview

The sync process consists of three phases:

- **Check Phase:**  
  - Retrieves remote changes via the provider.
  - Compares remote data with local data using type-specific handlers (e.g., conversations).
  - Updates progress and logs detected changes.

- **Upload Phase:**  
  - Iterates over changes detected in the check phase.
  - Uploads each change to the remote provider.
  - Updates progress and logs each successful upload.

- **Download Phase:**  
  - Lists all remote files.
  - Downloads each file and processes its content.
  - Updates progress and logs the downloads.

## Key Components

- **Handlers:**  
  Each type (e.g., conversations) implements a handler with functions:
  - `transform`: Prepares data for storage.
  - `validate`: Ensures data integrity.
  - `getChanges`: Compares local and remote data to detect differences.

- **Logging:**  
  Detailed logs are added in each phase to trace progress and errors.

- **Progress Tracking:**  
  The `createSync` module maintains phase, phase progress, total progress, and a current item tracker.

## Usage

The sync process is initiated by calling the `sync` method from the sync instance created via `createSync(provider)`. The process runs sequentially through each phase and reports errors if encountered.

```
const syncInstance = createSync(yourProvider);
await syncInstance.sync();
```

For more details, refer to the inline comments in the respective source files.
