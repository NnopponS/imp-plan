"""Original Devil's Plan Arena art. Run: blender -b -t 8 -P scripts/render-art.py"""
from pathlib import Path
import bpy, math, os
from mathutils import Vector

OUT=Path.cwd()/'art-source-renders'
OUT.mkdir(exist_ok=True)
PI=math.pi

def rgb(text):
    c=[int(text[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c)+(1,)

def material(name,col,metal=0,rough=.35,grain=0):
    m=bpy.data.materials.new(name);m.diffuse_color=rgb(col);m.use_nodes=True
    nodes=m.node_tree.nodes;p=nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=rgb(col)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if grain:
        tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=165
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=grain;bump.inputs['Distance'].default_value=.009
        m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

def coat(obj,m,edge=0):
    obj.data.materials.append(m)
    if edge:
        mod=obj.modifiers.new('Machined edge','BEVEL');mod.width=edge;mod.segments=3
        obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
    return obj

def disc(r,depth,xyz,m,edge=.02,n=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=xyz)
    return coat(bpy.context.object,m,edge)

def block(d,xyz,m,edge=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz);o=bpy.context.object;o.dimensions=d
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return coat(o,m,edge)

def loop(r,w,z,m,center=(0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=8,major_radius=r,minor_radius=w,location=(*center,z))
    return coat(bpy.context.object,m)

def rule(a,b,width,z,m):
    x,y=(a[0]+b[0])/2,(a[1]+b[1])/2
    seg=block((math.dist(a,b),width,.009),(x,y,z),m,0)
    seg.rotation_euler.z=math.atan2(b[1]-a[1],b[0]-a[0])
    return seg

def token(x,y,z,tone,ring=True,r=.23):
    disc(r,.109,(x,y,z),tone,.035)
    disc(r*.83,.022,(x,y,z+.056),tone,.01)
    if ring:loop(r*.7,.008,z+.068,brass,(x,y))

def render(name,target,cam,size,scale,motion=False):
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=36
    scene.cycles.use_denoising=False
    scene.render.resolution_x,scene.render.resolution_y=size;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Studio ambient')
    scene.world.color=(.29,.29,.29)
    scene.view_settings.view_transform='AgX'
    for loc,energy,size,color in [((-3.5,-4,7),430,4.5,(1,.88,.71)),((3,-.7,4.5),260,4,(.72,.84,1)),((0,4,5),360,3,(1,.92,.77))]:
        bpy.ops.object.light_add(type='AREA',location=loc)
        l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color
        l.rotation_euler=(Vector(target)-l.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=cam)
    c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler()
    c.data.type='ORTHO';c.data.ortho_scale=scale;scene.camera=c
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/(name+'.png'))
    if motion:
        scene.render.resolution_percentage=50
        scene.cycles.samples=16
        scene.render.fps=12
        scene.frame_start=1;scene.frame_end=36
        frames=OUT/'motion';frames.mkdir(exist_ok=True)
        scene.render.filepath=str(frames)+'/'
        bpy.ops.render.render(animation=True)
    else:
        bpy.ops.render.render(write_still=True)

def scene(theme):
    global brass, ivory, bone, oxblood, teal, ash, ink, wine, sand
    bpy.ops.wm.read_factory_settings(use_empty=True)
    brass=material('Satin brass','B99A62',.73,.28,.16)
    ivory=material('Bone ceramic','F7EBDD',.08,.29,.12)
    bone=material('Ivory marble','D9C9AE',.03,.39,.16)
    oxblood=material('Oxblood enamel','602626',.23,.25,.10)
    teal=material('Oxidized teal','284D4A',.31,.31,.11)
    ash=material('Blackened bronze','30251F',.38,.32,.15)
    ink=material('Inlay black','57605C',.18,.30)
    wine=material('Burgundy leather','AF7871',.02,.61,.24)
    sand=material('Matte stage',theme,.045,.52,.14)
    block((200,200,.2),(0,0,-.26),sand,0)

def hero():
    scene('E1CEAC')
    disc(2.2,.24,(0,0,-.03),ash,.05)
    disc(2.15,.07,(0,0,.115),bone,.03)
    disc(1.91,.03,(0,0,.155),ivory,.014)
    disc(1.5,.023,(0,0,.175),ash,.012)
    for r,z in [(2.12,.156),(1.94,.173),(1.81,.177),(1.52,.195),(1.37,.195),(.98,.195)]:
        loop(r,.012,z,brass)
    for i in range(72):
        a=i*PI/36;r0=1.66 if i%6==0 else 1.72
        rule((r0*math.cos(a),r0*math.sin(a)),(1.77*math.cos(a),1.77*math.sin(a)),.018 if i%6==0 else .009,.177,ink)
    for i in range(8):
        a=i*PI/4;x,y=math.cos(a),math.sin(a)
        rule((.28*x,.28*y),(1.32*x,1.32*y),.009,.197,brass)
    for x,y,z,m,r in [(-1.7,1.06,.24,teal,.19),(1.84,-.88,.24,oxblood,.21),(-1.5,-1.42,.24,ivory,.21),(1.6,.8,.24,ash,.18),(-2.2,-.65,-.08,oxblood,.17)]:
        token(x,y,z,m,r=r)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.94,location=(0,0,1.31))
    gem=bpy.context.object;gem.scale=(.84,.84,1.19);gem.rotation_euler=(.14,-.08,.37)
    gem.data.materials.append(ash);gem.data.materials.append(oxblood);gem.data.materials.append(teal);gem.data.materials.append(brass)
    for p in gem.data.polygons:p.material_index=3 if p.index in (3,16) else (p.index*7)%3
    cage=gem.copy();cage.data=gem.data.copy();bpy.context.collection.objects.link(cage)
    cage.data.materials.clear();cage.data.materials.append(brass)
    for p in cage.data.polygons:p.material_index=0
    wire=cage.modifiers.new('Metal seams','WIREFRAME');wire.thickness=.014;wire.use_even_offset=True
    motion=os.environ.get('ARENA_MOTION')=='1'
    if motion:
        for frame in range(1,37):
            t=(frame-1)/35
            a=math.sin(t*2*PI)
            b=math.sin(t*PI)**2
            for obj in (gem,cage):
                obj.location.z=1.31+.15*b
                obj.rotation_euler=(.14+.13*a,-.08,.37+1.8*b)
                obj.keyframe_insert(data_path='location',frame=frame)
                obj.keyframe_insert(data_path='rotation_euler',frame=frame)
    render('arena-stage',(0,0,.65),(4,-6.5,5.1),(1120,672),5.35,motion)

def board(name,theme,morris=False,point=False):
    scene(theme)
    base=block((3.15,3.15,.19),(0,0,-.035),ash,.06);base.rotation_euler.z=.0
    block((3.07,3.07,.07),(0,0,.08),bone,.04);block((2.85,2.85,.03),(0,0,.13),ivory,.024)
    for y in [-1.44,1.44]:rule((-1.44,y),(1.44,y),.024,.151,brass)
    for x in [-1.44,1.44]:rule((x,-1.44),(x,1.44),.024,.151,brass)
    if morris:
        for r in [1.24,.87,.50]:
            for sign in [-1,1]:
                rule((-r,r*sign),(r,r*sign),.024,.151,ink)
                rule((r*sign,-r),(r*sign,r),.024,.151,ink)
        for sign in [-1,1]:
            rule((0,.5*sign),(0,1.24*sign),.024,.151,ink)
            rule((.5*sign,0),(1.24*sign,0),.024,.151,ink)
        for i,(x,y) in enumerate([(-1.24,1.24),(0,1.24),(1.24,1.24),(-.87,0),(.5,-.5),(0,-.5),(0,-1.24)]):
            token(x,y,.206,[oxblood,oxblood,oxblood,teal,teal,teal,ivory][i],True,.14)
    else:
        for i in range(9):
            at=(i-4)*.305
            rule((-1.22,at),(1.22,at),.011,.151,ink)
            rule((at,-1.22),(at,1.22),.011,.151,ink)
        positions=[(-2,-1),(-1,0),(0,1),(1,2),(2,3),(-1,2),(1,-2),(0,-1),(2,0)]
        for i,(x,y) in enumerate(positions):
            color=(teal if i<5 else oxblood) if point else [ash,ash,ash,oxblood,ash,ivory,ash,oxblood,ash][i]
            token(x*.305,y*.305,.2,color,point,.133)
        if point:rule((-.61,-.305),(.61,.915),.043,.167,brass)
    token(1.9,-.75,-.079,oxblood,r=.14);token(1.75,-1.10,-.079,teal,r=.14)
    render(name,(0,0,.1),(3,-5,5.8),(650,430),4.25)

def auction():
    scene('B7CBC6')
    for r,d,z,m in [(1.40,.15,-.047,ash),(1.36,.09,.054,brass),(1.27,.045,.118,ivory),(1.13,.016,.146,teal)]:
        disc(r,d,(0,0,z),m,.023)
    loop(1.20,.016,.158,ash);loop(.96,.013,.158,brass)
    for i in range(48):
        a=i*PI/24;r0=.79 if i%4==0 else .86;u,v=math.cos(a),math.sin(a)
        rule((r0*u,r0*v),(.93*u,.93*v),.021 if i%4==0 else .009,.16,brass)
    for end,w,m in [((-.32,.44),.055,ivory),((.60,.29),.031,brass),((-.12,-.79),.015,oxblood)]:
        rule((0,0),end,w,.18,m)
    disc(.1,.035,(0,0,.19),brass,.009)
    block((.38,.39,.17),(0,1.47,-.022),brass,.046)
    loop(.23,.046,.034,brass,(.74,1.32))
    for k in range(3):
        token(1.52,-.58,-.089+.10*k,oxblood,True,.205)
    token(1.7,-1.08,-.09,ash,True,.20)
    render('auction',(0,0,.1),(1.6,-6,7),(650,430),4.02)

def remove_one():
    scene('C9A997')
    for idx, (x,y,angle,value,m) in enumerate([(-.68,.12,-.16,3,ivory),(.68,-.1,.20,7,oxblood)]):
        def xy(a,b):return x+a*math.cos(angle)-b*math.sin(angle),y+a*math.sin(angle)+b*math.cos(angle)
        card=block((1.37,2.11,.082),(x,y,-.066+.06*idx),m,.07)
        card.rotation_euler.z=angle
        z=-.019+.06*idx
        for dx,dy in [(-.48,-.80),(.48,-.80),(.48,.80),(-.48,.80)]:
            xx,yy=xy(dx,dy);disc(.047,.01,(xx,yy,z),brass,.006,n=16)
        for si in range(value):
            xx,yy=xy((si%2-.5)*.29,(si//2-1)*.34)
            disc(.102,.021,(xx,yy,z),teal if idx==0 else brass,.017,n=24)
    token(1.49,1.20,-.089,teal,r=.21)
    render('remove',(0,0,.03),(2.7,-4.8,6.6),(650,430),3.7)

def knight():
    scene('A9C0B7')
    base=block((3.14,3.14,.16),(0,0,-.065),ash,.065)
    for iy in range(5):
        for ix in range(5):
            block((.574,.574,.023),((ix-2)*.583,(iy-2)*.583,.028),ivory if (ix+iy)%2 else bone,.004)
    route=[(-1,-2),(0,0),(2,1),(0,2)]
    for a,b in zip(route,route[1:]):
        line=rule((a[0]*.583,a[1]*.583),(b[0]*.583,b[1]*.583),.023,.05,brass)
    for xy in route:
        disc(.084,.022,(xy[0]*.583,xy[1]*.583,.052),teal,.01)
    x,y=0,0
    disc(.29,.10,(x,y,.103),ash,.029,n=48)
    disc(.24,.082,(x,y,.166),brass,.018,n=48)
    # Extruded original chess-knight profile; the arched neck remains visible in three-quarter view.
    profile=[(-.21,.19),(.21,.19),(.14,.51),(.23,.62),(.27,.79),(.15,.86),(-.015,.87),(-.045,1.02),(-.14,.95),(-.16,.84),(-.27,.74),(-.32,.52),(-.22,.37)]
    count=len(profile)
    v=[(px+gx,py, pz) for py in [-.094,.094] for gx,pz in profile for px in [0]]
    faces=[tuple(reversed(range(count))),tuple(range(count,2*count))]+[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh=bpy.data.meshes.new('Sculpted knight');mesh.from_pydata(v,[],faces);mesh.update()
    o=bpy.data.objects.new('Chess knight',mesh);bpy.context.collection.objects.link(o);coat(o,teal,.024)
    for yy in [-.103,.103]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.024,location=(.113,yy,.787));coat(bpy.context.object,brass)
    render('knight',(0,0,.21),(2.8,-5.5,5.6),(650,430),3.82)

def puzzle_art():
    scene('D9B48E')
    disc(1.55,.15,(0,0,-.06),ash,.05,n=6)
    for r in range(-2,3):
        for q in range(-2,3):
            if abs(q+r)>2:continue
            x,y=(q+r/2)*.49,r*.426
            focus=r==0 and abs(q)<=1
            tile=disc(.254,.08,(x,y,.045),oxblood if focus else ivory,.013,n=6)
            tile.rotation_euler.z=math.pi/6
            for t in range(1+((q+2)*3+r+2)%4):
                disc(.028,.012,(x+(t-1.5)*.057,y,.091),brass if focus else ink,.004,n=20)
    render('hex',(0,0,0),(2.1,-4.2,5.6),(650,430),3.65)
    scene('B9C3B0')
    block((3.15,2.7,.14),(0,0,-.06),ash,.055)
    for r in range(5):
        for c in range(6):
            focus=1<=r<=3 and 2<=c<=4
            x,y=(c-2.5)*.48,(r-2)*.48
            block((.457,.457,.07),(x,y,.043),teal if focus else ivory,.013)
            for t in range(1+(r*5+c*3)%4):
                disc(.026,.01,(x+(t-1.5)*.064,y,.083),brass if focus else ink,.004,n=20)
    render('rectangles',(0,0,0),(2,-4.3,5.5),(650,430),3.65)

def arena_ten_art():
    scene('B5C4AC')
    disc(1.51,.165,(0,0,-.08),ash,.055)
    disc(1.42,.035,(0,0,.02),teal,.02)
    for i in range(12):
        a=i*math.pi/6;x=1.04*math.cos(a);y=1.04*math.sin(a)
        disc(.23,.057,(x,y,.064),brass,.016,n=40)
        disc(.191,.023,(x,y,.095),[wine,teal,bone][i%3],.012,n=40)
        for j in range(i%4):
            dx=.093*math.cos(j*2.4);dy=.093*math.sin(j*2.4)
            disc(.055,.043,(x+dx,y+dy,.126),ivory if j%2 else oxblood,.018,n=32)
    disc(.32,.075,(0,0,.09),brass,.025,n=48)
    disc(.237,.023,(0,0,.143),ash,.01,n=6)
    render('mancala',(0,0,0),(2.05,-4.55,5.69),(650,430),3.5)
    scene('D7B9A0')
    block((2.51,2.51,.13),(0,0,-.063),ash,.035)
    pattern=[[2,4,2],[1,3,3],[2,1,0]]
    for iy,row in enumerate(pattern):
        for ix,h in enumerate(row):
            for j in range(h):
                block((.73,.73,.368),((ix-1)*.77,(iy-1)*.77,.192+.395*j),[ivory,brass,wine,oxblood][j],.019)
    render('cubes',(0,0,.35),(3.5,-4.9,5.5),(650,430),4.02)
def arena_twelve_art():
    scene('CFB699')
    block((3.1,3.1,.165),(0,0,-.076),ash,.055)
    block((2.99,2.99,.045),(0,0,.025),bone,.03)
    for i in range(5):
        v=(i-2)*.60
        rule((-1.2,v),(1.2,v),.016,.058,ash)
        rule((v,-1.2),(v,1.2),.016,.058,ash)
    for x in range(4):
        for y in range(4):
            a,b=(x-2)*.60,(y-2)*.60
            start,end=((a,b),(a+.60,b+.60)) if (x+y)%2==0 else ((a+.60,b),(a,b+.60))
            rule(start,end,.016,.059,ash)
    for i,(x,y) in enumerate([(-1.2,-1.2),(1.2,-1.2),(-1.2,1.2),(1.2,1.2),(0,0),(.6,0),(-.6,0),(0,.6),(0,-.6)]):
        token(x,y,.105,oxblood if i<4 else ivory,r=.143)
    render('bagh',(0,0,.02),(2.2,-4.8,6.4),(650,430),3.85)
    scene('B7C8BA')
    for i,(x,y) in enumerate([(-.61,-.26),(0,0),(.61,.26)]):
        block((.9,1.48,.069),(x,y,.017+i*.089),[teal,oxblood,ivory][i],.049)
        for j in range(i+1):
            disc(.058,.015,(x-.134+.133*j,y,.055+i*.089),brass,.007,n=40)
        for z in [-.45,.45]:
            rule((x-.25,y+z),(x+.25,y+z),.01,.056+i*.089,brass)
    for i in range(4):disc(.146,.040,(.79,-.67,.034+i*.045),brass,.012,n=48)
    render('secret',(0,0,.14),(2.6,-4.8,6.6),(650,430),2.95)

def grass_art():
    for name,ground,colors in [('grass1','C7D1BA',('teal','ivory','brass')),('grass3','DFB4A2',('wine','teal','brass'))]:
        scene(ground)
        block((3.08,3.08,.14),(0,0,-.058),ash,.048)
        block((2.97,2.97,.043),(0,0,.021),bone,.028)
        for i in range(10):
            v=(i-4.5)*.288
            rule((-1.29,v),(1.29,v),.009,.044,ash)
            rule((v,-1.29),(v,1.29),.009,.044,ash)
        chunks=[[(1,1),(2,1),(1,2),(2,2),(2,3)],[(6,3),(7,3),(7,4),(7,5)],[(3,6),(4,6),(5,6),(4,7)]]
        for j,chunk in enumerate(chunks):
            for x,y in chunk:
                px,py=(x-4)*.288,(y-4)*.288
                block((.269,.269,.106),(px,py,.100),globals()[colors[j]],.024)
                if name=='grass3':disc(.035,.012,(px,py,.157),ivory,.004,n=24)
        if name=='grass3':
            for x,y in [(0,5),(1,6),(7,7),(3,3),(5,2)]:
                token((x-4)*.288,(y-4)*.288,.073,brass,ring=False,r=.074)
        render(name,(0,0,.02),(2.4,-4.3,7.2),(650,430),3.9)

def exile_art():
    scene('A8B7B0')
    block((3.0,2.35,.14),(0,0,-.06),ash,.05)
    for row in range(6):
        for col in range(8):
            x,y=(col-3.5)*.345,(row-2.5)*.345
            hit=2<=col<=5 and 1<=row<=3
            block((.327,.327,.067),(x,y,.042),teal if hit else ivory,.014)
            rule((x-.065,y),(x+.065,y),.015,.079,brass if hit else ink)
            if (row*3+col)%3:
                rule((x,y-.065),(x,y+.065),.015,.079,brass if hit else ink)
    render('exile',(0,0,0),(1.33,-4.3,5.5),(650,430),3.62)

def divine_art():
    scene('CBBFB1')
    block((3.12,3.12,.14),(0,0,-.066),ash,.055)
    for y in range(7):
        for x in range(7):
            px,py=(x-3)*.422,(y-3)*.422
            fixed=x==3 and y==3
            tone=oxblood if fixed else bone if (x+y)%2 else ivory
            block((.406,.406,.067),(px,py,.04),tone,.015)
            if ((x+2)*(y+5))%6==1 or fixed:
                token(px,py,.13,brass if fixed else teal,r=.133)
    render('divine',(0,0,0),(2.1,-4.5,6.2),(650,430),3.88)

def equation_art():
    scene('C8BBB1')
    block((3.8,1.94,.14),(0,0,-.055),ash,.06)
    for row, (line,tones) in enumerate([('2+3*4=14','IIIIIIII'),('1+3*7=22','TGGGIGTI'),('4+2*9=22','TGTGIGII')]):
        for i,ch in enumerate(line):
            x=(i-3.5)*.45;y=(1-row)*.52
            ground={'I':bone,'T':brass,'G':teal}[tones[i]]
            block((.413,.464,.088),(x,y,.058),ground,.028)
            bpy.ops.object.text_add(location=(x,y,.107))
            ob=bpy.context.object
            ob.data.body=ch;ob.data.align_x='CENTER';ob.data.align_y='CENTER'
            ob.data.size=.30;ob.data.extrude=.0015
            ob.data.materials.append(ivory if ground==teal else ash)
    render('equations',(0,0,0),(1.45,-4.25,7.2),(650,430),4.5)

def code_art():
    scene('BCAD9A')
    plum=material('Plum lacquer','714363',.2,.27,.13)
    block((3.68,2.50,.16),(0,0,-.05),ash,.055)
    for i in range(4):
        x=(i-1.5)*.83
        block((.71,.89,.058),(x,-.58,.06),bone,.035)
        tile=block((.63,.81,.097),(x,.62,.077),(teal,plum,brass,teal)[i],.045)
        tile.rotation_euler.z=(i-1.5)*.046
        bpy.ops.object.text_add(location=(x,.62,.141))
        ob=bpy.context.object
        ob.data.body=str((i*3)%4+1);ob.data.align_x='CENTER';ob.data.align_y='CENTER'
        ob.data.size=.34;ob.data.extrude=.002;ob.data.materials.append(ivory if i!=2 else ash)
        for y in [-.94,-.25]:
            disc(.033,.022,(x,y,.094),brass,.005,n=16)
    render('codeLock',(0,0,0),(2.25,-4.8,6.8),(650,430),4.4)

def pyramid_art():
    scene('B8AD9B')
    step=.62
    for row in range(5):
        for col in range(row+1):
            x=(col-row*.5)*step;y=(2-row)*step
            bright=(row,col) in [(2,1),(3,1),(3,2)]
            face=teal if bright else ivory
            block((.574,.57,.12),(x,y,.015),face,.042)
            bpy.ops.object.text_add(location=(x,y,.082))
            ob=bpy.context.object
            ob.data.body=str(1+(row*5+col*7)%12)
            ob.data.align_x='CENTER';ob.data.align_y='CENTER'
            ob.data.size=.29;ob.data.extrude=.0015;ob.data.materials.append(ivory if bright else ash)
    render('pyramid',(0,0,0),(1.30,-4.4,7.8),(650,430),4.0)

def fragments_art():
    scene('CCBBA4')
    for i,(x,y,sz,material_) in enumerate([
        (-1.17,.62,.29,teal),(-.28,.65,.29,oxblood),(.61,.65,.29,brass),
        (-1.17,-.47,.29,brass),(-.28,-.43,.29,teal),(.61,-.49,.29,ivory)]):
        block((.76,.79,.061),(x,y,-.01),ash,.03)
        if i%3==0:
            disc(sz,.22,(x,y,.135),material_,.06,n=6)
        elif i%3==1:
            token(x,y,.137,material_,r=sz)
        else:
            tile=block((sz*1.40,sz*1.40,.21),(x,y,.125),material_,.055);tile.rotation_euler.z=.3+i*.14
    disc(.43,.12,(1.54,.22,.011),brass,.05,n=48)
    disc(.37,.02,(1.54,.22,.083),ivory,.006,n=48)
    rule((1.54,.22),(1.70,.39),.027,.102,ash)
    rule((1.54,.22),(1.35,.43),.016,.105,oxblood)
    render('fragments',(0,0,0),(1.4,-4.8,6.6),(650,430),4.65)

def spot_art():
    scene('D5C3AA')
    for col in range(2):
        x=(col-.5)*1.65
        block((1.48,1.95,.13),(x,0,0),ash,.09)
        block((1.35,1.82,.07),(x,0,.083),ivory,.055)
        for i in range(6):
            u=x+(i%2-.5)*.62
            v=(1-i//2)*.55
            block((.51,.46,.048),(u,v,.142),brass,.025)
            if i==1 and col==1:continue
            if (i==2 and col==1) or i==4:
                a=block((.25,.25,.11),(u,v,.22),oxblood,.024);a.rotation_euler.z=.76
            else:
                disc(.14 if i!=5 or not col else .19,.12,(u,v,.218),[teal,brass][i%2],.022,n=5 if i%2 else 8)
    render('spot',(0,0,0),(.85,-3.9,7.1),(650,430),4.08)

def scale_art():
    scene('D6C2A7')
    block((3.25,1.55,.14),(0,0,.02),ash,.085)
    disc(.39,.15,(0,0,.16),oxblood,.05,n=42)
    disc(.115,1.03,(0,0,.58),brass,.025,n=24)
    block((2.62,.12,.12),(0,0,1.02),brass,.037)
    for i,x in enumerate([-1.15,1.15]):
        disc(.44,.09,(x,0,.56),brass,.038,n=56)
        disc(.375,.028,(x,0,.617),ivory,.012,n=56)
        for u in [-.23,.23]:
            block((.025,.025,.43),(x+u,0,.822),brass,.004)
        for j in range(i+2):
            disc(.17,.145,(x+(j-i*.5-.5)*.18, .055*(-1)**j,.72+j*.035),[teal,oxblood,brass][(i+j)%3],.037,n=6)
    render('scale',(0,0,.4),(1.42,-4.7,3.5),(650,430),4.14)

def fence_art():
    scene('DAC4A3')
    block((2.72,2.72,.14),(0,0,.0),ash,.09)
    block((2.49,2.49,.07),(0,0,.093),ivory,.07)
    for i in range(6):
        k=(i-2.5)*.425
        rule((-1.063,k),(1.063,k),.017,.139,brass)
        rule((k,-1.063),(k,1.063),.017,.139,brass)
    points=[(0,0),(3,0),(3,1),(5,1),(5,4),(2,4),(2,5),(0,5),(0,0)]
    p=[((x-2.5)*.425,(y-2.5)*.425) for x,y in points]
    for a,b in zip(p,p[1:]):rule(a,b,.061,.175,teal)
    for x,y in p[:-1]:disc(.054,.125,(x,y,.17),brass,.018,n=24)
    render('fence',(0,0,0),(1.35,-4.35,6.5),(650,430),4.05)

def tower_art():
    scene('CFB79A')
    block((2.58,2.48,.12),(0,0,0),ash,.08)
    for i,word in enumerate(['NOTE','BASS','DRUM']):
        x=(i-1)*.68
        block((.59,2.22,.07),(x,0,.079),brass,.055)
        for j,letter in enumerate(word):
            y=(1.5-j)*.48
            block((.48,.43,.16),(x,y,.18),ivory,.045)
            bpy.ops.object.text_add(location=(x,y,.269))
            glyph=bpy.context.object
            glyph.data.body=letter
            glyph.data.align_x='CENTER'
            glyph.data.align_y='CENTER'
            glyph.data.size=.246
            glyph.data.extrude=.003
            glyph.data.materials.append([teal,oxblood,ash][i])
    render('tower',(0,0,0),(.85,-3.9,7.2),(650,430),3.95)

if os.environ.get('ARENA_GAME_ART')=='arena-tower':
    tower_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-fence':
    fence_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-scale':
    scale_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-spot':
    spot_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-fragments':
    fragments_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-pyramid':
    pyramid_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-code':
    code_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-equations':
    equation_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-divine':
    divine_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-exile':
    exile_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-grass':
    grass_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-twelve':
    arena_twelve_art()
elif os.environ.get('ARENA_GAME_ART')=='arena-ten':
    arena_ten_art()
elif os.environ.get('ARENA_GAME_ART')=='puzzles':
    puzzle_art()
elif os.environ.get('ARENA_GAME_ART')=='season-two':
    remove_one();knight()
else:
    hero()
    if os.environ.get('ARENA_MOTION')!='1':
        board('blind','B8C0AB')
        board('morris','CF9B88',morris=True)
        auction()
        board('point','DECA95',point=True)
        remove_one();knight();puzzle_art();arena_ten_art();arena_twelve_art();grass_art();exile_art();divine_art();equation_art();code_art();pyramid_art();fragments_art();spot_art();scale_art();fence_art();tower_art()
