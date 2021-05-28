# https://github.com/dkelosky/hello-wto/blob/master/Makefile
# https://github.com/zowe/sample-spring-boot-api-service/blob/master/zowe-rest-api-sample-spring/zossrc/makefile

# target: dependencies
# <tab> rule

ASM = as

# https://www.ibm.com/docs/en/zos/2.4.0?topic=descriptions-ld-link-object-files
BIND = ld
TARGET = main
CC=xlc
CXX=xlc++

MACLIBS=-ISYS1.MACLIB \
 -ICBC.SCCNSAM \
 -ICA90SMVS.MOTM.CCS150.GA.P2.ASMMAC \
 -ICAI.S910.MACLIB

MTL_HEADERS=-I/usr/include/metal \
 -Ilib/

# https://www.ibm.com/docs/en/zos/2.3.0?topic=options-specifying-compiler-under-zos-unix
# https://www.ibm.com/docs/en/zos/2.3.0?topic=options-summary-compiler
# https://www.ibm.com/docs/en/xl-c-and-cpp-aix/16.1?topic=line-flag-options
MTL_OPTS=metal,\
 langlvl(extended),\
 sscom,\
 nolongname,\
 inline,\
 genasm,\
 inlrpt,\
 csect,\
 nose,\
 list,\
 optimize(2),\
 list,\
 showinc,\
 showmacro,\
 source,\
 aggregate

MTL_OPTS_64=lp64,\
 warn64,\
 $(MTL_OPTS)

MTL_FLAGS=-S -W "c,$(MTL_OPTS)"
MTL_FLAGS_64=-S -W "c,$(MTL_OPTS_64)"

# TODO(Kelosky): refresh
# https://www.ibm.com/docs/en/zos/2.1.0?topic=bor-binder-options
BIND_FLAGS = -bRMODE=ANY

ASM_FLAGS=-mrent

#
# LE STUFF
#
LE_BIND_FLAGS=-W "l,lp64,xplink,map,list" \
 -g \
 -qsource

FLAGS=-W "c,lp64,langlvl(extended),xplink,exportall"

CPP_FLAGS=-W "c,langlvl(extended),xplink,exportall"\
 -qsource \
 -g \
 -c

CPP_FLAGS_64=-W "c,lp64,langlvl(extended),xplink,exportall"\
 -qsource \
 -g \
 -c

BND_FLAGS=-W "l,xplink,map,list" \
 -g \
 -qsource

BND_FLAGS_64=-W "l,lp64,xplink,map,list" \
 -g \
 -qsource

all: $(TARGET)

# listings must have .lst suffix to be automatically downloaded
$(TARGET): $(TARGET).o
	$(BIND) $(BIND_FLAGS) -V -eMAIN -o $@ $^ > $*.bind.lst

$(TARGET).o: $(TARGET).s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst -o $@ $^

# target
lec: lec.c
	$(CC) $(FLAGS) -qlist=$*.c.lst -o $@ $^


# target
jsontest: jsontest.c
	$(CC) $(FLAGS) -qlist=$*.c.lst -o $@ $^

###
###
###
lib/run: lib/run.o lib/runexec.o mtlmain.o lib/ams.o
	$(CXX) $(BND_FLAGS) -o $@ $^ > $*.bind.lst

lib/run.o: lib/run.cpp
	$(CXX) $(CPP_FLAGS) -qlist=$*.cpp.lst -o $@ $^

lib/runexec.o: lib/runexec.s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst $(MACLIBS) -o $@ $<

lib/runexec.s: lib/runexec.c
	$(CC) $(MTL_FLAGS) -qlist=$*.mtl.lst $(MTL_HEADERS) -o $@ $<

###
### AMS utilities
###
lib/ams.o: lib/ams.s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst $(MACLIBS) -o $@ $<

lib/ams.s: lib/ams.c
	$(CC) $(MTL_FLAGS) -qlist=$*.mtl.lst $(MTL_HEADERS) -o $@ $^


zcov: zcov.o
	$(BIND) $(BIND_FLAGS) -V -eMAIN -o $@ $^ > $*.bind.lst

zcov.o: zcov.s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst $(MACLIBS) -o $@ $^

zcov.s: zcov.c
	$(CC) $(MTL_FLAGS_64) -qlist=$*.mtl.lst $(MTL_HEADERS) -o $@ $<


# target
# using $^ for all
mtlmain: mtlmain.o cas9rhsh.o lib/ams.o
	$(BIND) $(BIND_FLAGS) -V -eMAIN -o $@ $^ > $*.bind.lst

mtlmain.o: mtlmain.s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst $(MACLIBS) -o $@ $^

mtlmain.s: mtlmain.c
	$(CC) $(MTL_FLAGS_64) -qlist=$*.mtl.lst $(MTL_HEADERS) -o $@ $<

cas9rhsh.o: cas9rhsh.s
	$(ASM) $(ASMFLAGS) -a=$*.asm.lst $(MACLIBS) -o $@ $^

###
### Cleanup
###
.PHONY: clean
clean:
	rm -f *.o *.lst lib/*.o lib/*.lst
	rm -f $(TARGET)
