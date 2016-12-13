//
// template-rt.cpp
//

/******
 Thomas Chang
 Tests appear to have passed
 ******/
#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int g_width;
int g_height;

struct Ray
{
    vec4 origin;
    vec4 dir;
    int reflection;
};

// TODO: add structs for spheres, lights and anything else you may need.

//Sphere implementation
struct Sphere
{
    string sphere_id;
    vec4 origin;
    vec4 color; //vec 4?
    vec3 scale;
    float ka, kd, ks, kr;
    float n;
    mat4 sphere_trans;
    mat4 sphere_inverse;
};

struct Light
{
    string light_id;
    vec4 origin;
    vec4 color;
};

struct Intersection
{
    vec4 pos_of_intersection;
    vec4 normal_of_intersection;
    float distance_from_camera;
    int sphere_id;
    //ray and sphere intersected
    Ray ray;
    Sphere* sphere;
    bool is_interior;
};


vector<vec4> g_colors;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;

//Background and ambient color
vec4 g_background;
vec4 g_ambient;

vector<Sphere> g_spheres;
vector<Light> g_lights;
char* g_outputname;


// -------------------------------------------------------------------
// Input file parsing

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

void parseLine(const vector<string>& vs)
{
    //Code from discussion slides for doing switch statement with strings
    const int num_labels = 11;
    //0         //1         //2             //3                 //4         //5                 //6         //7         //8     //9
    const string labels[] = {"NEAR", "LEFT", "RIGHT", "BOTTOM", "TOP", "RES", "SPHERE", "LIGHT", "BACK", "AMBIENT", "OUTPUT"};
    unsigned label_id = find(labels, labels+num_labels, vs[0]) - labels;
    switch(label_id)
    {
        case 0:         g_near = toFloat(vs[1]);            break; //NEAR
        case 1:         g_left = toFloat(vs[1]);            break; //LEFT
        case 2:         g_right = toFloat(vs[1]);           break; // RIGHT
        case 3:         g_bottom = toFloat(vs[1]);          break; //BOTTOM
        case 4:         g_top = toFloat(vs[1]);         break; //TOP
        case 5:         g_width = (int)toFloat(vs[1]); //RES
            g_height = (int)toFloat(vs[2]);
            g_colors.resize(g_width * g_height);  break;
        case 6:                    {                                             //SPHERE
            Sphere temp_sphere;
            temp_sphere.sphere_id = vs[1];
            temp_sphere.origin = toVec4(vs[2], vs[3], vs[4]);
            temp_sphere.scale = vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]));
            temp_sphere.color = toVec4(vs[8], vs[9], vs[10]);
            temp_sphere.ka = toFloat(vs[11]);
            temp_sphere.kd = toFloat(vs[12]);
            temp_sphere.ks = toFloat(vs[13]);
            temp_sphere.kr = toFloat(vs[14]);
            temp_sphere.n = toFloat(vs[15]);
            
            //Sphere transform
            temp_sphere.sphere_trans = Translate(temp_sphere.origin) * Scale(temp_sphere.scale);
            //Sphere inverse
            InvertMatrix(temp_sphere.sphere_trans, temp_sphere.sphere_inverse);
            g_spheres.push_back(temp_sphere);
            break;
        }
        case 7: {                                                           //LIGHT
            Light temp_light;
            temp_light.light_id = vs[1];
            temp_light.origin = toVec4(vs[2], vs[3], vs[4]);
            temp_light.color = toVec4(vs[5], vs[6], vs[7]);
            g_lights.push_back(temp_light);
            break;
        }
            
        case 8:                                                                     //BACK
            g_background = toVec4(vs[1], vs[2], vs[3]);
            break;
        case 9:                                                                 //AMBIENT
            g_ambient = toVec4(vs[1], vs[2], vs[3]);
            break;
        case 10:                                                                //OUTPUT
            //savePPM requires char*, so save it into g_outputname
            int stringlength = vs[1].length();
            g_outputname = (char*)malloc(stringlength+1);
            for(int i = 0; i<stringlength; i++)
                g_outputname[i] = vs[1][i];
            //add nullbyte
            g_outputname[stringlength] = '\0';
            break;
    }
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}


// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}


// -------------------------------------------------------------------
// Intersection routine

// TODO: add your ray-sphere intersection routine here.
Intersection RaySphereIntersect(const Ray& ray)
{
    Intersection temp_intersect;
    temp_intersect.distance_from_camera=-43110; //placeholder value
    
    //go through each sphere in g_spheres
    for(Sphere& sphere:g_spheres)
    {
        bool is_interior = false;
        //using notation from the discussion slides:
        vec4 c = sphere.sphere_inverse * ray.dir;
        vec4 S = sphere.sphere_inverse * (sphere.origin - ray.origin);
        
        //Solving the quadratic equation..
        float A = dot(c, c); //c^2
        float B = dot(S, c); //S dot c
        float C = dot(S, S) -1; //S^2-1
        float solve;
        float under_radical = B * B - A * C;
        if(under_radical < 0)
            continue; //No solution
        else if(under_radical==0)
            solve = B/A;
        else //two solutions
        {
            float sq_root = sqrtf(under_radical);
            float minus_root = (B-sq_root)/A; //Did not mult by -1
            float plus_root = (B+sq_root)/A;
            
            //save intersection with the smallest distance
            if(minus_root < plus_root)
                solve=minus_root;
            else solve = plus_root;
            //if solution invalid
            if(solve<=.0001f || (ray.reflection==0 && solve<=1.0f))             {
                if (minus_root > plus_root)
                    solve = minus_root;
                else solve = plus_root;
                is_interior = true;
            }
        }
        //Now if this solution is not valid
        if(solve<=.0001f || (ray.reflection==0 && solve<=1.0f))
            continue;
        
        //If there is a closer sphere, make that the sphere of intersection
        //If no sphere had been found yet, set it
        if(temp_intersect.distance_from_camera!=-43110 && temp_intersect.distance_from_camera>solve)
        {
            temp_intersect.distance_from_camera=solve;
            temp_intersect.sphere=&sphere;
            temp_intersect.is_interior=is_interior;
        }
        if(temp_intersect.distance_from_camera==-43110)
        {
            temp_intersect.distance_from_camera=solve;
            temp_intersect.sphere=&sphere;
            temp_intersect.is_interior=is_interior;
        }
        
    }
    
    if(temp_intersect.distance_from_camera!=-43110)
    {
        temp_intersect.pos_of_intersection=ray.origin + ray.dir * temp_intersect.distance_from_camera;
        
        vec4 temp = temp_intersect.pos_of_intersection - temp_intersect.sphere->origin;
        temp = temp_intersect.is_interior ? -temp: temp;
        temp = transpose(temp_intersect.sphere->sphere_inverse) * temp_intersect.sphere->sphere_inverse * temp; temp.w = 0;
        temp_intersect.normal_of_intersection=normalize(temp);
    }
    return temp_intersect;
}

// -------------------------------------------------------------------
// Ray tracing

vec4 trace(const Ray& ray)
{
    // TODO: implement your ray tracing routine here.
    Intersection temp_intersection = RaySphereIntersect(ray);
    
    if(ray.reflection>=3)
        return vec4();
    else if (temp_intersection.distance_from_camera==-43110 && ray.reflection==0)
        return g_background;
    else if(temp_intersection.distance_from_camera==-43110)
        return vec4();
    
    vec4 diffusion = vec4(0, 0, 0, 0);
    vec4 spec = vec4(0, 0, 0, 0);
    vec4 intersection_color = temp_intersection.sphere->color* temp_intersection.sphere->ka *g_ambient;
    
    //go through all lights, create intersection ray
    for(Light light : g_lights)
    {
        Ray temp_ray;
        temp_ray.origin = temp_intersection.pos_of_intersection;
        temp_ray.dir = light.origin - temp_intersection.pos_of_intersection;
        temp_ray.dir = normalize(temp_ray.dir);
        
        //Make sure ray is not being blocked
        Intersection checkBlock = RaySphereIntersect(temp_ray);
        if(checkBlock.distance_from_camera==-43110) //if not blocked
        {
            float diffuse_light_intensity = dot(temp_intersection.normal_of_intersection, temp_ray.dir);
            if(diffuse_light_intensity>0)
            {
                diffusion += diffuse_light_intensity * light.color * temp_intersection.sphere->color;
                
                //half vector
                vec4 half_vector = normalize(temp_ray.dir - ray.dir);
                
                //Intensity
                float intensity = dot(temp_intersection.normal_of_intersection, half_vector);
                spec += powf(powf(intensity, temp_intersection.sphere->n), 3) * light.color;
            }
        }
    }
    //diffusion & spec
    intersection_color += diffusion * temp_intersection.sphere->kd+spec*temp_intersection.sphere->ks;
    
    //Recursive call
    Ray next_ray;
    next_ray.origin = temp_intersection.pos_of_intersection;
    next_ray.dir = normalize(ray.dir - 2.0f * temp_intersection.normal_of_intersection * dot(temp_intersection.normal_of_intersection, ray.dir));
    next_ray.reflection = ray.reflection+1;
    intersection_color += trace(next_ray) * temp_intersection.sphere->kr;
    
    return intersection_color;
}

vec4 getDir(int ix, int iy)
{
    // TODO: modify this. This should return the direction from the origin
    // to pixel (ix, iy), normalized.
    float x, y, z;
    x = g_left + ((float)ix/g_width)*(g_right-g_left);
    y = g_bottom+((float)iy/g_height)*(g_top-g_bottom);
    z = -g_near;
    return vec4(x, y, z, 0.0f);
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray);
    setColor(ix, iy, color);
}

void render()
{
    for (int iy = 0; iy < g_height; iy++)
        for (int ix = 0; ix < g_width; ix++)
            renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels)
{
    FILE *fp;
    const int maxVal=255;
    
    printf("Saving image %s: %d x %d\n", fname, Width, Height);
    fp = fopen(fname,"wb");
    if (!fp) {
        printf("Unable to open file '%s'\n", fname);
        return;
    }
    fprintf(fp, "P6\n");
    fprintf(fp, "%d %d\n", Width, Height);
    fprintf(fp, "%d\n", maxVal);
    
    for(int j = 0; j < Height; j++) {
        fwrite(&pixels[j*Width*3], 3, Width, fp);
    }
    
    fclose(fp);
}

void saveFile()
{
    // Convert color components from floats to unsigned chars.
    // TODO: clamp values if out of range.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
            {
                float col = ((float*)g_colors[y*g_width+x])[i];
                if(col>1) col=1;
                buf[y*g_width*3+x*3+i] = (unsigned char)(col* 255.9f);
            }
    // TODO: change file name based on input file name.
    savePPM(g_width, g_height, g_outputname, buf);
    delete[] buf;
    free(g_outputname);
}


// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        cout << "Usage: template-rt <input_file.txt>" << endl;
        exit(1);
    }
    loadFile(argv[1]);
    render();
    saveFile();
    return 0;
}
