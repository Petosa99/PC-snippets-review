/*
    Script Name:    calculateSegmentSize
    Customer:       VisualVault
    Purpose:        The purpose of this snippet is calculate the optimal number to segment an array
    Parameters:     The following represent variables passed into the function:  
                    -inputArray: array of records to process
                    -batchLimit: max number of batches that can be created
    Return Value:   The following represents the value being returned from this function: 
                    None    
    Date of Dev: 12/12/2022
    Last Rev Date: 12/12/2022
    Revision Notes: Franco Petosa Ayala: Script created. 
*/


function calculateSegmentSize(inputArr, batchLimit){
    
    const arrSize = inputArr.length;
    const segmentSize = Math.ceil(arrSize / batchLimit);
    return segmentSize;

}