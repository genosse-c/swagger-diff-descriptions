# swagger-diff-descriptions

## Usage
Allows uploading two versions of a swagger.json file. After uploading, files are compared and the result displayed in a list of foldable lists

## Notes
The heavy lifting of actually comparing the two json objects is done by *deep diff* from [flitbit](https://github.com/flitbit/diff), which is MIT licensed.
