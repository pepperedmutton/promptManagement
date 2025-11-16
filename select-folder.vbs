Set objShell = CreateObject("Shell.Application")
Set objFolder = objShell.BrowseForFolder(0, "Select folder containing Stable Diffusion images", 0)

If Not objFolder Is Nothing Then
    Set objFolderItem = objFolder.Self
    strPath = objFolderItem.Path
    
    ' Write the selected path to a temporary file
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objFile = objFSO.CreateTextFile("selected-folder.txt", True)
    objFile.WriteLine(strPath)
    objFile.Close
    
    WScript.Echo strPath
Else
    WScript.Echo "CANCELLED"
End If