#include <iostream>
#include <stdlib.h>
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

void call_alloc(char *);
void allocate();

EXTF *bpxwdyn = (EXTF *)fetch("BPXWDYN");

//   ofstream myfile;
//   myfile.open ("//DD:SNAP");

// "ALLOC FI(SYSPRINT) PATH('/dev/fd1')  PATHOPTS(OWRONLY) FILEDATA(TEXT) MSG(2)"

int main()
{
    cout << "c++ hello" << endl;

    allocate();
    int i = RUNEXE("parm from c++");
    // call_alloc();

    cout << "c++ return" << i << endl;
}

void allocate() {

    vector<char *> dds;
    dds.push_back("alloc fi(syslib) da(sys1.maclib) shr msg(2)");
    // dds.push_back("alloc fi(snap) path('/tmp/kelda16/maketso1/zossrc/snap.txt') PATHOPTS(OWRONLY,OCREAT,OTRUNC) PATHMODE(SIRWXU)");
    dds.push_back("alloc dd(steplib) path('/tmp/kelda16/maketso1/zossrc') ");
    // dds.push_back("alloc fi(snap) sysout(*) ");
    // dds.push_back("alloc fi(snap) path('/dev/fd1') pathopts(owronly) filedata(text) msg(2)");
    // dds.push_back("alloc fi(sysprint) path('/dev/fd1') pathopts(owronly) filedata(text) msg(2)");
    dds.push_back("alloc fi(sysprint) path('/dev/fd1') pathopts(owronly) filedata(text) msg(2)");

    for (vector<char *>::iterator it = dds.begin(); it != dds.end(); it++) {
        call_alloc(*it);
    }
}

void call_alloc(char *allocString)
{
    int rc = bpxwdyn(allocString);

    if (0 != rc) {
        cout << ">> Failure for: '" << allocString << "' rc: " << hex << rc << endl;
    }
}

