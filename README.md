# zdev tool

Dev tool inspired by `zowe-api-dev`.

## Flow

1. assemble `.s` file, outputs:
    - `<source>.s.lst` and `<source>.s.adata`
2. `zdev parse-adata .listing\<project>\<source>.s.adata`, outputs:
    - `.zdev\coverage\<source>.s.adata.json`
    - `.zdev\coverage\<source>.s.zcovin.txt`
3. upload `<source>.s.zcovin.txt` to `<USER>.PUBLIC.<PROJECT>.ZCOVIN(INPUT)`
4. run `zcov` via `./lib/run` for dynamic allocations, outputs:
    - `<USER>.PUBLIC.<PROJECT>.ZCOVOUT(OUTPUT)`
    - `<USER>.PUBLIC.<PROJECT>.ZCOVOUT(REPORT)`
5. download `<USER>.PUBLIC.<PROJECT>.ZCOVOUT(REPORT)` to `.zdev\coverage\<source>.s.results.txt`

## Files

Description of files and contents:

- [.zdev\coverage\<source>.s.adata.json](#adata-json)
- [.zdev\coverage\<source>.s.zcovin.txt](#adata-zcovin)
- [.zdev\coverage\<source>.s.results.txt](#results-txt)
- [coverage\coverage-final.json](#coverage-final-json)

### adata json

Example (truncated):

```json
{
    "machineRecords": [
        {
            "esdid": 1,
            "statementNumber": 6,
            "locationCounter": 0,
            "instructionOffset": 40,
            "instructionLength": 4,
            "valueOfInstruction": [
                18416,
                61466
            ],
            "valueOfInstructionHex": "47F0 F01A"
        },
        {
            "esdid": 1,
            "statementNumber": 11,
            "locationCounter": 26,
            "instructionOffset": 40,
            "instructionLength": 4,
            "valueOfInstruction": [
                37100,
                53260
            ],
            "valueOfInstructionHex": "90EC D00C"
        }
    ],
    "sourceAnalysisRecords": [
        {
            "esdid": 0,
            "statementNumber": 1,
            "inputRecordNumber": 1,
            "parentRecordNumber": 0,
            "inputAssignedFileNumber": 1,
            "parentAssignedFileNumber": 0,
            "locationCounter": 0,
            "inputRecordOrigin": 1,
            "parentRecordOrigin": 0,
            "printFlags": 168,
            "sourceRecordType": 3,
            "assemblerOperationCode": 61,
            "flags": 0,
            "offsetOfNameEntryInStatementField": 0,
            "lengthOfNameEntry": 4,
            "offsetOfOperationEntryInStatementField": 9,
            "lengthOfOperationEntry": 5,
            "offsetOfOperandEntryInStatementField": 15,
            "lengthOfOperandEntry": 3,
            "offsetOfRemarksEntryInStatementField": 0,
            "lengthOfRemarksEntry": 0,
            "offsetOfContinuationIndicatorField": 0,
            "inputMacroOfCopyMemberNameOffset": 0,
            "inputMacroOfCopyMemberLengthOffset": 0,
            "parentMacroOfCopyMemberNameOffset": 0,
            "parentMacroOfCopyMemberLengthOffset": 0,
            "sourceRecordOffset": 136,
            "sourceRecordLength": 80,
            "inputMacroOrCopyMemberName": "fakename",
            "parentMacroOrCopyMemberName": "fakemember",
            "sourceRecord": "fake record"
        },
        ...
```

### adata zcovin

Comma separated file where each value respectively is:

- statement number
- offset
- instruction length
- 2 bytes of an instruction
- 2 bytes of an instruction [optional depending on length]
- 2 bytes of an instruction [optional depending on length]

Example:

```txt
6,0,4,18416,61466
11,26,4,37100,53260
16,30,4,42760,5
17,34,4,42776,6
18,38,4,43000,7
19,42,2,6399
20,44,4,42996,20
22,48,4,43000,4
23,52,4,43000,5
24,56,4,43000,6
25,60,4,43000,7
28,64,4,42760,4
29,68,4,43000,3
32,72,4,22752,53260
33,76,4,38924,53268
34,80,2,2046
35,82,2,2046
39,84,4,43000,4
40,88,4,42996,65524
```

### results txt

Comma separated file where each value respectively is:

- statement number
- offset
- hit count

Example:

```txt
6,0,1
11,26,1
16,30,1
17,34,1
18,38,1
19,42,1
20,44,1
22,48,0
23,52,0
24,56,0
25,60,0
28,64,1
29,68,1
32,72,1
33,76,1
34,80,1
35,82,0
39,84,1
40,88,1

```

### coverage-final json

Example (truncated):

```json
{
    "C:\\dev\\asm\\zcov\\zossrc\\main.s": {
        "statementMap": {
            "0": {
                "start": {
                    "line": 7,
                    "column": 1
                },
                "end": {
                    "line": 7,
                    "column": null
                }
            },
            "1": {
                "start": {
                    "line": 8,
                    "column": 1
                },
                "end": {
                    "line": 8,
                    "column": null
                }
            },
            "2": {
                "start": {
                    "line": 9,
                    "column": 1
                },
                "end": {
                    "line": 9,
                    "column": null
                }
            },
            "3": {
                "start": {
                    "line": 10,
                    "column": 1
                },
                "end": {
                    "line": 10,
                    "column": null
                }
            },
            "4": {
                "start": {
                    "line": 11,
                    "column": 1
                },
                "end": {
                    "line": 11,
                    "column": null
                }
            }
        },
        "path": "C:\\dev\\asm\\zcov\\zossrc\\main.s",
        "branchMap": {},
        "fnMap": {},
        "s": {
            "0": 1,
            "1": 1,
            "2": 1,
            "3": 1,
            "4": 1
        },
        "f": {},
        "b": {}
    }
}
```
