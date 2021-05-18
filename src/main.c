#include <time.h>
#include <stdlib.h>

#define WASM_EXPORT __attribute__((visibility("default")))

extern unsigned char __heap_base;

unsigned int bump_pointer = &__heap_base;

extern unsigned short rand_js();

int WINDOW[2]={ 0, 0 };
int MAXITERATION = 0;
double MANDELBROTSCALE[4]={ 0, 0, 0, 0 };


unsigned short *Green;
unsigned short *Blue;
unsigned short *Red;


WASM_EXPORT
void* malloc_(int n) {
  unsigned int r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
};

WASM_EXPORT
void  init(int x, int y, int iteraciones) {
  WINDOW[0] = x;
  WINDOW[1] = y;
  MAXITERATION =iteraciones;
	srand(time(NULL));
		Green = (unsigned short*) malloc(iteraciones + 1);
    Blue = (unsigned short*) malloc(iteraciones + 1);
    Red = (unsigned short*) malloc(iteraciones + 1);
    for (int i = 0; i <= iteraciones; i++) { Green[i] = rand_js(); }
	  for (int i = 0; i <= iteraciones; i++) { Blue[i] = rand_js(); }
	  for (int i = 0; i <= iteraciones; i++) { Red[i] = rand_js(); }
}

WASM_EXPORT
void delColores (){
  free (Green);
  free (Blue);
  free (Red);
}


WASM_EXPORT
void setScaleMandelbrotSet(double Mscale0, double Mscale1, double Mscale2, double Mscale3){
   MANDELBROTSCALE[0] = Mscale0; 
   MANDELBROTSCALE[1] = Mscale1; 
   MANDELBROTSCALE[2] = Mscale2; 
   MANDELBROTSCALE[3] = Mscale3; 
}

void scale(int Px, int Py, double scaled[2]) {
	scaled[0] = (MANDELBROTSCALE[1] - MANDELBROTSCALE[0]) / WINDOW[0] * Px + MANDELBROTSCALE[0];
	scaled[1] = (MANDELBROTSCALE[3] - MANDELBROTSCALE[2]) / WINDOW[1] * Py + MANDELBROTSCALE[2];
}

WASM_EXPORT
void mandelbrot (unsigned char Tab [], int TabLen) {
	int contPtrTab = 0;
	double scaled[2];
	for (int y = 0; y < WINDOW[1]; y++) {
		for (int x = 0; x < WINDOW[0]; x++) {
			scale(x, y, scaled);
			int iteration = 0;
			double a = 0.0, b = 0.0;
			while (a*a + b * b <= 2 * 2 && iteration < MAXITERATION) {
				double atmp = a * a - b * b + scaled[0];
				b = 2 * a * b + scaled[1];
				a = atmp;
				iteration++;
			}
      int sc= contPtrTab;
			Tab[sc] = (unsigned char)Red[iteration];
			Tab[sc+1] = (unsigned char)Green[iteration];
			Tab[sc+2] = (unsigned char)Blue[iteration];
      Tab[sc+3] = (unsigned char)255;
			contPtrTab += 4;
      if (contPtrTab >= TabLen) {break;}
		}
	}
}
