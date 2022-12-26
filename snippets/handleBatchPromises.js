/*
    Script Name:    recursiveBatchHandling
    Customer:       VisualVault
    Purpose:        The purpose of this snippet is to process a large number of records using batches and recursion
    Parameters:     The following represent variables passed into the function:  
                    - inputArray: array of records to process
                    - callback: callback function to process the records
                    - paramsArray: array of parameters for the callback function
    Return Value:   Promise
    Date of Dev: 12/12/2022
    Last Rev Date: 12/12/2022
    Revision Notes: 12/12/2022 - Franco Petosa Ayala: Script created. 
                    12/26/2022 - Emanuel Jofré: Rename identifiers and simplify code.
*/

const batchLimit = 25; // Move this to the Configurable Variables section

function recursiveBatchHandling(inputArray, callback, paramsArray) {
  function createBatches(inputArray, batchSize) {
    // Creates an array of arrays of size batchSize
    function reducer(previousValue, currentValue, index) {
      const batchIndex = Math.floor(index / batchSize);

      // If there is no batch at this index, create one
      if (!previousValue[batchIndex]) {
        previousValue[batchIndex] = [];
      }

      // Add the current value to the batch
      previousValue[batchIndex].push(currentValue);

      return previousValue;
    }

    const initialValue = [];
    const batch = inputArray.reduce(reducer, initialValue);

    return batch;
  }

  function recursionHandling(arr, index = 0) {
    //Base case: when the last element of the array is reached

    return new Promise((resolve) => {
      callback(arr[index], ...paramsArray).then(() => {
        //if the position next to the current is defined, it means there still is a record to process
        if (arr[index + 1]) {
          resolve(recursionHandling(arr, index + 1));
        } else {
          resolve();
        }
      });
    });
  }

  const batchSize = Math.ceil(inputArray / batchLimit);
  const batches = createBatches(inputArray, batchSize);

  return Promise.all(batches.map((batch) => recursionHandling(batch)));
}
