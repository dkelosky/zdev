#include <iostream>
#include <stdlib.h>
#include <string.h>
#include "runexec.h"
#include <vector>

using namespace std;

#pragma runopts(trap(off)) // nospie), ter(uadump))
// #pragma runopts(ter(uadump), trap(on, nospie)) // nospie), )
// #pragma runopts(ter(uadump), trap(on, nospie)) // nospie), )
// #pragma runopts(trap(on, nospie), ter(uadump))

// typedef int EXTF(char *);
extern "OS_UPSTACK" typedef int EXTF(char *);
// #pragma linkage(EXTF, OS_UPSTACK)
// #pragma linkage(EXTF, OS)

struct Alloc
{
    char dd[8];
    char nullSep0;
    char dsn[48];
    char nullSep1;
};

void call_alloc(char *);
void allocate(vector<Alloc> &allocs);

EXTF *bpxwdyn = (EXTF *)fetch("BPXWDYN");

//   ofstream myfile;
//   myfile.open ("//DD:SNAP");

// "ALLOC FI(SYSPRINT) PATH('/dev/fd1')  PATHOPTS(OWRONLY) FILEDATA(TEXT) MSG(2)"

// TODO(Kelosky): make cli parms for dynmic allocation

// ./lib/run --program test --dds sysprint "kelda16.public.zcov.sysprint(output)"

const char *PROGRAM = "--program";
const char *DDS = "--dds";
const char *PARAMETERS = "--parameters";
const char *HELP = "--help";

int main(int argc, char *argv[])
{
    cout << "[DEBUG] c++ entry" << endl;
    cout << "[DEBUG] c++ parms:" << endl;

    // if (argc < 2)
    // {
    //     cout << "[ERROR] Missing parameters, e.g. module name, e.g. ./run --program main" << endl;
    //     return 16;
    // }

    char *program = NULL;
    char *parameters = NULL;
    char dds = NULL;

    vector<Alloc> allocs;
    bool isdds = false;
    // int allocIndex = 0;

    // TODO(Kelosky): better parsing

    for (int i = 0; i < argc; ++i)
    {
        if (strcmp(PROGRAM, argv[i]) == 0)
        {
            isdds = false;
            program = argv[i + 1];
            if (i + 1 > argc - 1)
            {
                cout << "[ERROR] Missing program name, e.g. ./run --program main" << endl;
                return 16;
            }
        }

        else if (strcmp(HELP, argv[i]) == 0)
        {
            isdds = false;
            cout << "[INFO] ./run --program main ----parameters \"some parms here\" --dds sysprint ibuser.sysprint(out) sysin ibuser.sysin" << endl;
            return 16;
        }

        else if (strcmp(PARAMETERS, argv[i]) == 0)
        {
            isdds = false;
            parameters = argv[i + 1];
            if (i + 1 > argc - 1)
            {
                cout << "[ERROR] Missing paramters value, e.g. ./run --program main --parameters \"some parms here\"" << endl;
                return 16;
            }
        }

        else if (strcmp(DDS, argv[i]) == 0)
        {
            isdds = true;
            // program = argv[i + 1];
            // if (i + 1 > argc - 1)
            // {
            // cout << "[ERROR] Missing program paramter name, e.g. ./run --program main" << endl;
            // return 16;
            // }
        }
        else
        {
            if (isdds)
            {
                Alloc a = {0};
                strcpy(a.dd, argv[i]);
                strcpy(a.dsn, argv[i + 1]);
                allocs.push_back(a);
                i++;
            }
        }

        // cout << argv[i] << "\n";
    }

    // for (vector<Alloc>::iterator it = allocs.begin(); it != allocs.end(); it++)
    // {
    //     // call_alloc(*it);
    //     cout << "dd: '" << it->dd << "' dsn: '" << it->dsn << "'" << endl;
    // }

    if (NULL == program)
    {
        cout << "[ERROR] Missing parameters, e.g. module name, e.g. ./run --program main" << endl;
        return 16;
    }

    allocate(allocs);
    int rc = RUNEXE(program, parameters);
    // call_alloc();

    cout << "[DEBUG] c++ return, rc:" << rc << endl;
    // cout << "[DEBUG] c++ return, rc:" << endl;
}

void allocate(vector<Alloc> &allocs)
{

    // vector<char *> dds;
    char buffer[256] = {0};

    for (vector<Alloc>::iterator it = allocs.begin(); it != allocs.end(); it++)
    {
        // call_alloc(*it);
        // cout << "dd: '" << it->dd << "' dsn: '" << it->dsn << "'" << endl;
        sprintf(buffer, "alloc fi(%s) dsn('%s') SHR", it->dd, it->dsn);
        cout << "[DEBUG] "<< buffer << endl;
        call_alloc(buffer);
    }

    // dds.push_back("alloc fi(syslib) da(sys1.maclib) shr msg(2)");
    // dds.push_back("alloc fi(snap) path('/tmp/kelda16/maketso1/zossrc/snap.txt') PATHOPTS(OWRONLY,OCREAT,OTRUNC) PATHMODE(SIRWXU)");
    // dds.push_back("alloc dd(steplib) path('/tmp/kelda16/maketso1/zossrc') ");
    // dds.push_back("alloc fi(snap) sysout(*) ");
    // dds.push_back("alloc fi(snap) path('/dev/fd1') pathopts(owronly) filedata(text) msg(2)");
    // dds.push_back("alloc fi(sysprint) path('/dev/fd1') pathopts(owronly) filedata(text) msg(2)");
    // dds.push_back("alloc fi(sysprint) dsn('KELDA16.PUBLIC.ZCOV3.SYSPRINT(OUTPUT)') SHR");
    // dds.push_back("alloc fi(sysprint) path('/tmp/kelda16/maketso1/zossrc/example.txt') pathopts(owronly,ocreat,otrunc) filedata(text) msg(2)");

    // for (vector<char *>::iterator it = dds.begin(); it != dds.end(); it++)
    // {
    //     call_alloc(*it);
    // }
}

void call_alloc(char *allocString)
{
    int rc = bpxwdyn(allocString);

    if (0 != rc)
    {
        cout << "[ERROR] Failure for: '" << allocString << "' rc: " << rc << " && " << hex << rc << endl;
    }
}
