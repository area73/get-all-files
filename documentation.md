## Constants

<dl>
<dt><a href="#getAllFilesSync">getAllFilesSync</a> ⇒</dt>
<dd><p>syncronous function to get all file names from a given entry point</p>
</dd>
<dt><a href="#getAllFiles">getAllFiles</a> ⇒</dt>
<dd><p>asyncronous function to get all file names from a given entry point</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#normalizeOpSysPath">normalizeOpSysPath(path)</a> ⇒</dt>
<dd><p>a function to replace window&#39;s path separator to unix like separator &#39;/&#39;
and also remove ending separator to standardized path.</p>
</dd>
<dt><a href="#isDirInList">isDirInList(excludedPaths, reference)</a> ⇒</dt>
<dd><p>Helper function to check wether a given list of filepaths are included in
searching directory</p>
</dd>
<dt><a href="#normalizeDirname">normalizeDirname(filename, useAbsoluteRute)</a> ⇒</dt>
<dd><p>helper function to return absolute or relative filename</p>
</dd>
<dt><a href="#isExcluded">isExcluded(dirname, options)</a> ⇒ <code>boolean</code></dt>
<dd><p>helper function to determine if a dirname is skip or not according to options</p>
</dd>
<dt><a href="#traverseSync">traverseSync(dirname, options)</a> ⇒</dt>
<dd><p>traverse function to walk through all file directories</p>
</dd>
<dt><a href="#notifier">notifier()</a> ⇒</dt>
<dd><p>a notifier will keep track of each async call made to read a dir and will act as a
global promise</p>
</dd>
<dt><a href="#traverse">traverse(dirnames, filenames, globalNotifier, options)</a> ⇒</dt>
<dd><p>traverse function to walk through all file directories</p>
</dd>
</dl>

<a name="getAllFilesSync"></a>

## getAllFilesSync ⇒
syncronous function to get all file names from a given entry point

**Kind**: global constant  
**Returns**: an Iterator with a .toString() helper function to return a list of filenames  

| Param | Description |
| --- | --- |
| filename | entry point path to look for files |
| options | wether to use absolute or relative paths and excluded dirs |

<a name="getAllFiles"></a>

## getAllFiles ⇒
asyncronous function to get all file names from a given entry point

**Kind**: global constant  
**Returns**: an Iterator with a .toString() helper function to return a list of filenames  

| Param | Description |
| --- | --- |
| filename | entry point path to look for files |
| options | wether to use absolute or relative paths and excluded dirs |

<a name="normalizeOpSysPath"></a>

## normalizeOpSysPath(path) ⇒
a function to replace window's path separator to unix like separator '/'
and also remove ending separator to standardized path.

**Kind**: global function  
**Returns**: normalized path (unix style)  

| Param | Description |
| --- | --- |
| path | a string path like to normalize |

<a name="isDirInList"></a>

## isDirInList(excludedPaths, reference) ⇒
Helper function to check wether a given list of filepaths are included in
searching directory

**Kind**: global function  
**Returns**: boolean  

| Param | Description |
| --- | --- |
| excludedPaths | list of directories to be excluded |
| reference | root reference of searching directory |

<a name="normalizeDirname"></a>

## normalizeDirname(filename, useAbsoluteRute) ⇒
helper function to return absolute or relative filename

**Kind**: global function  
**Returns**: a normalized filename, if useAbsoluteRoute it will return an absolute filename otherwise
 it will return filename unmodify  

| Param |
| --- |
| filename | 
| useAbsoluteRute | 

<a name="isExcluded"></a>

## isExcluded(dirname, options) ⇒ <code>boolean</code>
helper function to determine if a dirname is skip or not according to options

**Kind**: global function  
**Returns**: <code>boolean</code> - true if found as excluded  

| Param |
| --- |
| dirname | 
| options | 

<a name="traverseSync"></a>

## traverseSync(dirname, options) ⇒
traverse function to walk through all file directories

**Kind**: global function  
**Returns**: Generator  

| Param | Description |
| --- | --- |
| dirname | root dirname to look |
| options | <OptionsParameters> |

<a name="notifier"></a>

## notifier() ⇒
a notifier will keep track of each async call made to read a dir and will act as a
global promise

**Kind**: global function  
**Returns**: notifier  
<a name="traverse"></a>

## traverse(dirnames, filenames, globalNotifier, options) ⇒
traverse function to walk through all file directories

**Kind**: global function  
**Returns**: void  

| Param | Type |
| --- | --- |
| dirnames |  | 
| filenames |  | 
| globalNotifier |  | 
| options | <code>OptionsParameters</code> | 

