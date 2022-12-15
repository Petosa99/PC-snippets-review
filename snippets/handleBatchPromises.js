/*
    Script Name:    handleBatchPromises
    Customer:       VisualVault
    Purpose:        The purpose of this snippet is to process a large number of records using batches and recursion
    Parameters:     The following represent variables passed into the function:  
                    -inputArray: array of records to process
                    -callback: callback function to process the records
                    -segmentSize: number value that represents the size of the segmented arrays
    Return Value:   The following represents the value being returned from this function:
                    None
    Date of Dev: 12/12/2022
    Last Rev Date: 12/12/2022
    Revision Notes: Franco Petosa Ayala: Script created. 
*/

function handleBatchPromises(inputArray, callback, objData){

    //recursive function

    function handleRecursion(arr, index, objData){
        
        //Base case: when the last element of the array is reached

        return new Promise((resolve) => {

            callback(arr[index], objData)
            .then(() => {

                //if the position next to the current is defined, it means there still is a record to process
                if(arr[index + 1]){

                    resolve(handleRecursion(arr, index + 1, objData ))

                }else{

                    resolve();
                }
            })
        })
    }

    //aux functions

    function calculateSegmentSize(inputArr, batchLimit){
    
        const arrSize = inputArr.length;
        const segmentSize = Math.ceil(arrSize / batchLimit);
        return segmentSize;
    
    }

    function createArraySegments(inputArray, segmentSize) {

        // Creates an array of arrays of size segmentSize
        function reducer(previousValue, currentValue, index) {
            const segmentIndex = Math.floor(index / segmentSize);
      
            // If there is no array(segment) at this index, create one
            if (!previousValue[segmentIndex]) {
                previousValue[segmentIndex] = [];
            }
        
            // Add the current value to the array(segment)
            previousValue[segmentIndex].push(currentValue);
        
            return previousValue;
        }
      
        const initialValue = [];
      
        const segmentedArray = inputArray.reduce(reducer, initialValue);
      
        return segmentedArray;
    }

    //configurable variables

    const batchLimit = 25; //this value can be modified

    const segmentSize = calculateSegmentSize(inputArray, batchLimit);

    const segmentedArray = createArraySegments(inputArray, segmentSize);

    return Promise.all(segmentedArray.map(array => {
        return handleRecursion(array, 0, objData)
    }))
}
