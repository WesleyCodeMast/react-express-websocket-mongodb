
export const downloadFile = (path) => {
    let filePathToDownload = path;

    const link = document.createElement('a');
    link.href = filePathToDownload;
    link.target = '_blank'
    link.click();
}