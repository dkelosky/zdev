*PROCESS RENT
         GBLC  &MODNAME
&MODNAME SETC  'ASMTES64'
&MODNAME RSECT ,
&MODNAME AMODE 64
&MODNAME RMODE ANY
         SYSSTATE ARCHLVL=2,                                           +
               AMODE64=YES
*=====================================================================*
*        This module is used as a simple test program that starts out *
*        as AMODE=64.                                                 *
*                                                                     *
*                                                                     *
*        Merge this with LDEVTEST!!!                                  *
*=====================================================================*
*
         EJECT ,
*=====================================================================*
*        Equates                                                      *
*=====================================================================*
*
         YREGS ,                       Register EQU's
*
RTNCD00  EQU    0                      Return code  0
RTNCD04  EQU    4                      Return code  4
RTNCD08  EQU    8                      Return code  8
RTNCD12  EQU   12                      Return code 12
RTNCD16  EQU   16                      Return code 16
*
RSNCD00  EQU    0                      Reason code  0
RSNCD04  EQU    4                      Reason code  4
RSNCD08  EQU    8                      Reason code  8
RSNCD12  EQU   12                      Reason code 12
RSNCD16  EQU   16                      Reason code 16
*
SEG#RQST EQU    1                      Number of segments to request
*
         EJECT ,
*=====================================================================*
*        Mainline                                                     *
*                                                                     *
*        Register conventions:                                        *
*            R0-R9: Work                                              *
*              R10: A(WRK)                                            *
*              R11: A(OBJ)                                            *
*              R12: A(CONSTANT)                                       *
*              R13: A(SAVF4SA)                                        *
*          R14-R15: Work                                              *
*                                                                     *
*=====================================================================*
*
         EJECT ,
***********************************************************************
*        Initial setup                                                *
***********************************************************************
*
         SAVE  (14,12),,'&MODNAME  &SYSTIME &SYSDATE' Save regs
*
         LARL  R12,CONSTANT            Establish base
*
         USING CONSTANT,R12            Constant area addressabiltiy
*
         LGR    R2,R1                  Copy entry parameter address
*
         STORAGE OBTAIN,               Get work area                   +
               LENGTH=WRKLEN,            length                        +
               SP=WRKSPID,                 subpool                     +
               LOC=(24,64)                   below the line for OPEN
*
         LGR   R10,R1                  R10 -> new storage area
*
         USING WRK,R10                 WRK area addressability
*
*        Clear WRK area and init
*
         LA    R0,WRK                  -> Output address
         LHI   R1,WRKLEN               = Output length
         SLGR  R15,R15                 Pad + input length
         MVCL  R0,R14                  Clear acquired storage
*
         MVC   WRKID,=A(WRKIDC)        Identifier
         MVI   WRKSP,WRKSPID           Subpool
         MVC   WRKLN,=AL3(WRKLEN)      Length
*
*        Chain save areas
*
         LA    R2,WRKF4SA              -> F4SA save area
*
C        USING SAVF4SA,R13             Caller's F4SA save area
O        USING SAVF4SA,R2              Our F4SA save area
*
         STG   R2,C.SAVF4SANEXT        Save for caller's next SA
         STG   R13,O.SAVF4SAPREV       Save our previous SA
         MVC   O.SAVF4SAID,=A(SAVF4SAID_VALUE) Set F4SA identifier
*
         DROP  C,O                     Drop named USINGS of F4SA
*
         LGR   R13,R2                  -> F4SA save area
*
         USING SAVF4SA,R13             Address our F4SA save area
*
*        Get private memory object
*
         MVC   WRKSEG#,=AD(SEG#RQST)   Set # of segments requesting
*
         IARV64 REQUEST=GETSTOR,                                       +
               ORIGIN=WRKMEMO@,                                        +
               SEGMENTS=WRKSEG#,                                       +
               COND=YES,                                               +
               MF=(E,WRKIARV,COMPLETE)
*
         LTR   R15,R15                 Was request successful??
         JZ    *+4+6                   Yes, continue
         EXRL  0,*                     *** S0C3 ABEND ***
*
*        Initialize OBJ area
*
         LG    R11,WRKMEMO@            -> OBJ area
*
         USING OBJ,R11                 OBJ area addressability
*
         MVC   OBJID,=A(OBJIDC)        Identifier
*
         EJECT ,
***********************************************************************
*        Test code here vvv                                           *
***********************************************************************
*                                                                     *
*        Do stuff                                                     *
*                                                                     *
         SLGR  R0,R0                   Show no MLWTO                  *
         WTO   '@TEST - AMODE=64'      Write a message                *
*                                                                     *
         LGF   R0,WRKFULL              Load 64-reg with 32 bytes      *
         LGFR  R1,R0                   Load 64-reg with 32 bytes      *
*                                                                     *
         EJECT ,                                                      *
***********************************************************************
*        Cleanup resources                                            *
***********************************************************************
*
*        Free memory object
*
         IARV64 REQUEST=DETACH,                                        +
               MEMOBJSTART=WRKMEMO@,                                   +
               MF=(E,WRKIARV,COMPLETE)
*
*        Free WRK area
*
         LG    R13,SAVF4SAPREV         -> Caller's save area
         LA    R1,WRK                  R1 -> dynamicly aquired area
*
         STORAGE RELEASE,              Free Storage                    +
               LENGTH=WRKLEN,                                          +
               ADDR=(R1)
*
         LGFI  R15,RTNCD00             Set return code = 0
*
*        Restore caller's regs and return
*
         RETURN (14,12),,RC=(15)       Return to caller
*
         EJECT ,
*=====================================================================*
*        Cosntant Area                                                *
*=====================================================================*
*
         PRINT DATA
CONSTANT DS    0D                      Constant area
         LTORG ,
*
         EJECT ,
*=====================================================================*
*        Work Area                                                    *
*=====================================================================*
WRKSPID  EQU   0
*
WRK      DSECT ,
WRKID    DS    CL4                     Identifier
WRKIDC   EQU   C'WRK*'                 Identifier character string
WRKSP    DC    AL1(WRKSPID)            Subpool
WRKLN    DC    AL3(*-*)                Length
*
WRKDBLE  DS    D                       Doubleword work field
WRKFULL  DS    F                       Fullword work field
WRKHALF  DS    H                       Halfword work field
         DS    H                       Alignment
*
WRKFLAGS DS    0F                      Fullword of flags
WRKFLAG0 DS    X                         Flag byte 0
WRKFLAG1 DS    X                         Flag byte 1
WRKFLAG2 DS    X                         Flag byte 2
WRKFLAG3 DS    X                         Flag byte 3
*
WRKSEG#  DS    D                       Number of segments
WRKMEMO@ DS    AD                      Membory object address
*
WRKDESC  DS    CL8                     Description text
WRKRC    DS    F                       Return code
WRKRSN   DS    F                       Reason code
*
         DS    0D                      Alignment
WRKF4SA  DS    XL(SAVF4SA_LEN)         F4SA save area
*
*        DS    0D                      Alignment implied in IARV64
         IARV64 MF=(L,WRKIARV)
*
WRKLEN   EQU   *-WRK                   Length of WRK DSECT
*
         EJECT ,
*=====================================================================*
*        Memory object                                                *
*=====================================================================*
OBJ      DSECT ,
OBJID    DS    CL4                     Identifier
OBJIDC   EQU   C'OBJ*'                 Identifier character string
*
OBJDBLE  DS    D                       Doubleword work field
OBJFULL  DS    F                       Fullword work field
OBJHALF  DS    H                       Halfword work field
         DS    H                       Alignment
*
OBJLEN   EQU   *-OBJ                   Length of OBJ DSECT
*
         EJECT ,
*=====================================================================*
*        DSECTs                                                       *
*=====================================================================*
*
         IHASAVER ,                                                    +
               SAVER=NO,                                               +
               SAVF4SA=YES,                                            +
               SAVF5SA=NO,                                             +
               SAVF7SA=NO,                                             +
               SAVF8SA=NO
*
         END   &MODNAME
