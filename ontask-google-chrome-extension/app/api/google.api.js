exports.createDriveFolder = (drive, folderName, result) => {
    let folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
    };

    drive.files.create({
        resource: folderMetadata,
        fields: 'id'
    }, (err, res) => {
        if (err) result(err, null);
        else result(null, res.data.id);
    });
}

exports.getDriveFolder = (drive, folderName, result) => {
    // Create folder if not already existed
    if (true) {
        this.createDriveFolder(drive, folderName, result)
    }
}

exports.addFileToFolder = (drive, folderId, fileContent, fileName, result) => {
    let fileMetadata = {
        name: fileName,
        parents: [folderId]
    };

    let media = {
        mimeType: 'application/pdf',
        body: fileContent
    };

    drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
    }, (err, res) => {
        if (err) result(err, null);
        else {
            result(null, res.data.id);
        }
    });
}

exports.appendDataToSheet = (sheets, spreadsheetID, spreadsheetName, resource, result) => {
    sheets.spreadsheets.values.append({
        "spreadsheetId": spreadsheetID,
        "range": spreadsheetName,
        "valueInputOption": "USER_ENTERED",
        "resource": resource
    }, (err, response) => {
        if (err) result(err, null);
        else result(null, response);
    });
}