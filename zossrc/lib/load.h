#ifndef LOAD_H
#define LOAD_H

#include <stdio.h>
#include "csvexti.h"

#if defined(__IBM_METAL__)
#define LOAD_MODEL(loadm)                                       \
    __asm(                                                      \
        "*                                                  \n" \
        " LOAD EPLOC=,"                                         \
        "EXTINFO=,"                                             \
        "SF=L                                               \n" \
        "*                                                    " \
        : "DS"(loadm));
#else
#define LOAD_MODEL(loadm)
#endif

LOAD_MODEL(loadModel); // make this copy in static storage

#if defined(__IBM_METAL__)
#define IDENTIFY(ep, name, rc)                                    \
    __asm(                                                        \
        "*                                                  \n"   \
        " IDENTIFY EPLOC=%1,"                                     \
        "ENTRY=(%2)                                           \n" \
        " ST  15,%0        -> Save EP                       \n"   \
        "*                                                    "   \
        : "=m"(*rc)                                               \
        : "m"(name),                                              \
          "r"(ep)                                                 \
        : "r0", "r1", "r14", "r15");
#else
#define IDENTIFY(ep, name, rc)
#endif

#if defined(__IBM_METAL__)
#define LOAD(ep, name)                                          \
    __asm(                                                      \
        "*                                                  \n" \
        " LOAD EPLOC=%1,"                                       \
        "ERRET=*+4+4                                        \n" \
        " ST  0,%0        -> Save EP                        \n" \
        "*                                                    " \
        : "=m"(ep)                                              \
        : "m"(name)                                             \
        : "r0", "r1", "r14", "r15");
#else
#define LOAD(ep, name)
#endif

#if defined(__IBM_METAL__)
#define LOAD_WITH_INFO(ep, name, info, plist)                   \
    __asm(                                                      \
        "*                                                  \n" \
        " LOAD EPLOC=%2,"                                       \
        "EXTINFO=%1,"                                           \
        "ERRET=*+4+4,"                                          \
        "SF=(E,%3)                                          \n" \
        "*                                                  \n" \
        " ST  0,%0        -> Save EP                        \n" \
        "*                                                    " \
        : "=m"(ep),                                             \
          "=m"(*info)                                           \
        : "m"(name),                                            \
          "m"(plist)                                            \
        : "r0", "r1", "r14", "r15");
#else
#define LOAD_WITH_INFO(ep, name, info, plist)
#endif

#if defined(__IBM_METAL__)
#define DELETE(name)                                            \
    __asm(                                                      \
        "*                                                  \n" \
        " DELETE EPLOC=%0                                   \n" \
        "*                                                    " \
        :                                                       \
        : "m"(name)                                             \
        : "r0", "r1", "r14", "r15");
#else
#define DELETE(name)
#endif

static void *__ptr32 loadModule(const char *name)
{
    char tempName[9];
    void *__ptr32 ep = NULL;
    sprintf(tempName, "%-8.8s", name);

    LOAD(ep, tempName);

    return ep;
}

static int identify(const char *name, void *__ptr32 ep)
{

    int rc = 0;

    char tempName[9];
    // void *__ptr32 ep = NULL;
    sprintf(tempName, "%-8.8s", name);

    IDENTIFY(ep, tempName, &rc);

    return rc;
}

static void *__ptr32 loadModuleWithInfo(const char *name, struct exti *info)
{
    char tempName[9];
    void *__ptr32 ep = NULL;
    sprintf(tempName, "%-8.8s", name);

    LOAD_MODEL(dsaLoadModel); // stack var
    dsaLoadModel = loadModel; // copy model

    LOAD_WITH_INFO(ep, tempName, info, dsaLoadModel);

    return ep;
}

static void deleteModule(const char *name)
{
    char tempName[9];
    sprintf(tempName, "%-8.8s", name);

    DELETE(tempName);
}

#endif