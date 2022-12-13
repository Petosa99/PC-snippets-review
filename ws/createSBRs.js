const logger = require('../log');

module.exports.getCredentials = function () {
    let options = {};
    options.customerAlias = "DevelopmentLibraryTe";
    options.databaseAlias = "Default";
    options.userId = "DevLibraryTesting.api";
    options.password = "&n>/sLcX]9qB";
    options.clientId = "cec3d7de-7d53-4f9f-b49a-39c8c8f04a14";
    options.clientSecret = "QdtJXYbqpbTlgtEvRFFQ3i3Aup3bg5oe4Chq3EhWKQY=";
    return options;
};

module.exports.main = async function (ffCollection, vvClient, response) {
    /*
    Script Name:    createSBRs
    Customer:       Pierce County
    Purpose:        The purpose of this script is to recreate a similar scenario like in PC and 
                    create a large number of SBRs.
    Preconditions:
                    
    Parameters:     The following represent variables passed into the function:
                    CPRID: The current form ID
                    Revision ID: The current form revision ID
                    MechaProcess: The mechanism choosen to process the large number of SBRs
                    NumbOfSBRsToCreate: The total number of SBRs desired to create
    Return Object:
                    outputCollection[0]: Status
    Pseudo code: 
                   
    Date of Dev:    12/12/2022
    Last Rev Date:  12/12/2022
 
    Revision Notes:
                    12/12/2022 - Franco Petosa Ayala:  First Setup of the script
    */

    logger.info(`Start of the process SCRIPT NAME HERE at ${Date()}`);

    /* -------------------------------------------------------------------------- */
    /*                    Response and error handling variables                   */
    /* -------------------------------------------------------------------------- */

    // Response array
    let outputCollection = [];
    // Array for capturing error messages that may occur during the process
    let errorLog = [];

    /* -------------------------------------------------------------------------- */
    /*                           Configurable Variables                           */
    /* -------------------------------------------------------------------------- */

    const SBRTemplateName = 'Service Billing Record';
    const batchSize = 50;

    /* -------------------------------------------------------------------------- */
    /*                          Script 'Global' Variables                         */
    /* -------------------------------------------------------------------------- */

    // Description used to better identify API methods errors
    let shortDescription = '';

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function getFieldValueByName(fieldName, isRequired = true) {
        /*
        Check if a field was passed in the request and get its value
        Parameters:
            fieldName: The name of the field to be checked
            isRequired: If the field is required or not
        */

        let resp = null;

        try {
            // Tries to get the field from the passed in arguments
            const field = ffCollection.getFormFieldByName(fieldName);

            if (!field && isRequired) {
                throw new Error(`The field '${fieldName}' was not found.`);
            } else if (field) {
                // If the field was found, get its value
                let fieldValue = field.value ? field.value : null;

                if (typeof fieldValue === 'string') {
                    // Remove any leading or trailing spaces
                    fieldValue = fieldValue.trim();
                }

                if (fieldValue) {
                    // Sets the field value to the response
                    resp = fieldValue;
                } else if (isRequired) {
                    // If the field is required and has no value, throw an error
                    throw new Error(`The value property for the field '${fieldName}' was not found or is empty.`);
                }
            }
        } catch (error) {
            // If an error was thrown, add it to the error log
            errorLog.push(error);
        }
        return resp;
    }

    function parseRes(vvClientRes) {
        /*
        Generic JSON parsing function
        Parameters:
            vvClientRes: JSON response from a vvClient API method
        */
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(vvClientRes);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === 'object') {
                vvClientRes = jsObject;
            }
        } catch (e) {
            // If an error occurs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return vvClientRes;
    }

    function checkMetaAndStatus(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

        if (!vvClientRes.meta) {
            throw new Error(`${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status != 200 && status != 201 && status != ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : 'unspecified';
            throw new Error(`${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }
        return vvClientRes;
    }

    function checkDataPropertyExists(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object exists
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    function checkDataIsNotEmpty(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object is not empty
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === 'object';
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == 'Error') {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }
        return vvClientRes;
    }

    function createSBRs(numb, CPRID, CPR_RevisionID){

        const postFormData = {};
        postFormData.Name = 'Name' + numb;
        postFormData.LastName = 'LastName' + numb;
        postFormData.CPRID = CPRID;

        return vvClient.forms
            .postForms(null, postFormData, SBRTemplateName)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription))
            .then((res) => vvClient.forms.relateForm(res.data.revisionId, CPR_RevisionID))
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then(() => 'created')
            .catch((error) => error)


    }

    function handleBatchPromises(inputArray, callback, formID, revisionID){

        //recursive function

        function handleRecursion(arr, index, formID, revisionID){

            //Recursive function
            //Base case: when the last element of the array is reached

            return new Promise((resolve) => {

                callback(arr[index], formID, revisionID)
                .then(() => {

                    //if the position next to the current is defined, it means there still is a record to process
                    if(arr[index + 1]){

                        resolve(handleRecursion(arr, index + 1, formID, revisionID))

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
            return handleRecursion(array, 0, formID, revisionID)
        }))
    }

    function handleRecursion(arr, index, CPRID, CPR_RevisionID){

        //Recursive function
        //Base case: when the last element of the array is reached

        return new Promise(function(resolve){

            createSBRs(CPRID, arr[index], CPR_RevisionID)
            .then((promiseResult) => {

                //verify if the SBR process result failed
                if(promiseResult != 'created'){
                    //save the error on the error log array
                    errorLog.push(promiseResult);
                }

                //no matter the result continue processing

                //if the position next to the current is defined, it means there still is a record to process
                if(arr[index + 1]){
                    resolve(handleRecursion(arr, index + 1, CPRID, CPR_RevisionID))
                }else{
                    //if the next position in the array is undefined it means the current position is the last element from the array
                    resolve();
                }
            })


        })

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
      
    /* -------------------------------------------------------------------------- */
    /*                                  MAIN CODE                                 */
    /* -------------------------------------------------------------------------- */

    try {

        // GET THE VALUES OF THE FIELDS

        const CPRID = getFieldValueByName('CPRID');
        const CPR_RevisionID = getFieldValueByName('Revision ID');
        const mechaProcess = getFieldValueByName('MechaProcess');
        const numbOfSBRsToCreate = parseInt(getFieldValueByName('NumbOfSBRsToCreate'));


        // YOUR CODE GOES HERE

        //inicialize array
        const arr = [];
        for (let index = 0; index < numbOfSBRsToCreate; index++) {
            arr[index] = index + 1;
        }

        switch (mechaProcess) {

            case 'batch':

                for (let i = 0; i < arr.length; i += batchSize) {

                    const batchArr = arr.slice(i, i + batchSize);
                    
                    const batchResultProcess = await Promise.all(batchArr.map(element =>{ 
                        
                        return createSBRs(CPRID, element, CPR_RevisionID)
        
                    }))

                    //identify if any request could not be fullfillied
                    batchResultProcess.forEach(promiseResult => {
                        if(promiseResult != 'created'){
                            errorLog.push(promiseResult);
                        }
                    })
                }

                
            break;

            case 'one by one':

                for (let i = 0; i < arr.length; i++) {

                    await createSBRs(CPRID, i, CPR_RevisionID);

                }    

                
            break;

            case 'recursion':

                await handleRecursion(arr, 0, CPRID, CPR_RevisionID);

                
            break;

            case 'mix':

                await handleBatchPromises(arr, createSBRs, CPRID, CPR_RevisionID);

            break;
        
            default:
                throw new Error('No valid mechanism process');
        }

        // BUILD THE SUCCESS RESPONSE ARRAY

        outputCollection[0] = 'Success';
        
    } catch (error) {
        logger.info(`Error encountered ${error}`);

        // BUILD THE ERROR RESPONSE ARRAY

        outputCollection[0] = 'Error'; // Don´t change this

        if (errorLog.length > 0) {
            outputCollection[1] = 'Some errors ocurred';
            outputCollection[2] = `Error/s: ${errorLog.join('; ')}`;
        } else {
            outputCollection[1] = error.message ? error.message : `Unhandled error occurred: ${error}`;
        }
    } finally {
        // SEND THE RESPONSE

        response.json(200, outputCollection);
    }
};
