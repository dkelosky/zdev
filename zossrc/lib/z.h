#ifndef Z_H
#define Z_H

#if defined(__IBM_METAL__)

// on z
#define ATTRIBUTE(setting) __attribute__((setting)) // ATTRIBUTE(amode31)
#define PTR32 __ptr32
#define PTR64 __ptr64
#define ASMREG(register) __asm(register)

#else

// off z
#define ATTRIBUTE(mode)
#define PTR32
#define PTR64
#define ASMREG(register)

#endif

#define MAX_PARM_LENGTH 100 + 1

typedef struct
{
    short int length;
    char parms[MAX_PARM_LENGTH];
} IN_DATA;

#define HI_BIT_MASK 0x7FFFFFFF
typedef struct
{
    union
    {
        IN_DATA *PTR32 addr;
        int addrValue;
    } data;
} IN_PARM;

#if defined(__IBM_METAL__)
#define S0C3(n)                                                 \
    __asm(                                                      \
        "*                                                  \n" \
        " LLGF  0,%0      = Value passed by caller          \n" \
        " EXRL  0,*       Execute myself                    \n" \
        " DC    C'@S0C3'  Find by '@S0C3'                     " \
        "*                                                    " \
        :                                                       \
        : "m"(n)                                                \
        : "r0");
#else
#define S0C3(n)
#endif

static void s0c3Abend(int n)
{
    S0C3(n);
}

// int reg = 0;
// GET_REG(13, &reg);
#if defined(__IBM_METAL__)
#define GET_REG(num, reg)                                         \
    __asm(                                                        \
        "*                                                  \n"   \
        " ST    " #num ",%0 = Value passed by caller          \n" \
        "*                                                    "   \
        : "=m"(*reg)                                              \
        :                                                         \
        :);
#else
#define GET_REG(num, reg)
#endif

#if defined(__IBM_METAL__)
#define SET_REG(num, reg)                                         \
    __asm(                                                        \
        "*                                                  \n"   \
        " L    %0," #num "  = Value passed by caller          \n" \
        "*                                                    "   \
        : "=m"(*reg)                                              \
        :                                                         \
        : "#num");
#else
#define SET_REG(num, reg)
#endif

#endif