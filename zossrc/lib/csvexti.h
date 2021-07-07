#pragma pack(packed)

#ifndef __exti__
#define __exti__

struct exti {
  char           exti___version;            /* Must be initialized to 0                */
  char           exti___numextents;         /* 1 to 16                                 */
  char           exti___auth;               /* Authorization                           */
  unsigned char  _filler1[5];               /* Reserved                                */
  union {
    unsigned char  _exti___epa___bassm[8]; /* Entry Point address. This address is in the */
    struct {
      unsigned char  _exti___epa___bassm___h[4]; /* High half */
      unsigned char  _exti___epa___bassm___l[4]; /* Low half  */
      } _exti_struct1;
    } _exti_union1;
  union {
    unsigned char  _exti___epa[8]; /* Entry Point address. This has no AMODE bits */
    struct {
      unsigned char  _exti___epa___h[4]; /* High half */
      unsigned char  _exti___epa___l[4]; /* Low half  */
      } _exti_struct2;
    } _exti_union2;
  unsigned char  exti___xattr1[8];          /* Extended attributes                     */
  unsigned char  _filler2[16];              /* Reserved                                */
  unsigned char  exti___extent___area[256]; /* EXTI_NUMEXTENTS contiguous entries each */
  };

#define exti___epa___bassm     _exti_union1._exti___epa___bassm
#define exti___epa___bassm___h _exti_union1._exti_struct1._exti___epa___bassm___h
#define exti___epa___bassm___l _exti_union1._exti_struct1._exti___epa___bassm___l
#define exti___epa             _exti_union2._exti___epa
#define exti___epa___h         _exti_union2._exti_struct2._exti___epa___h
#define exti___epa___l         _exti_union2._exti_struct2._exti___epa___l

/* Values for field "exti___extent___area" */
#define exti___len 0x130

#endif

#ifndef __extixe__
#define __extixe__

struct extixe {
  union {
    unsigned char  _extixe___addr[8]; /* Address */
    struct {
      unsigned char  _extixe___addr___h[4]; /* High half */
      unsigned char  _extixe___addr___l[4]; /* Low half  */
      } _extixe_struct1;
    } _extixe_union1;
  union {
    unsigned char  _extixe___length[8]; /* Length */
    struct {
      unsigned char  _extixe___length___h[4]; /* High half */
      unsigned char  _extixe___length___l[4]; /* Low half  */
      } _extixe_struct2;
    } _extixe_union2;
  };

#define extixe___addr       _extixe_union1._extixe___addr
#define extixe___addr___h   _extixe_union1._extixe_struct1._extixe___addr___h
#define extixe___addr___l   _extixe_union1._extixe_struct1._extixe___addr___l
#define extixe___length     _extixe_union2._extixe___length
#define extixe___length___h _extixe_union2._extixe_struct2._extixe___length___h
#define extixe___length___l _extixe_union2._extixe_struct2._extixe___length___l

/* Values for field "extixe___length___l" */
#define extixe___len 0x10

#endif

#pragma pack(reset)
