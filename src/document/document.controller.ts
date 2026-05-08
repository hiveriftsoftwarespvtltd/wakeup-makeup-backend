import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DocumentService } from './document.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('document')
export class DocumentController {
    constructor(private documentService:DocumentService){}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    upload(@UploadedFile() file:Express.Multer.File,@Body('folder') folder:string){
        return this.documentService.upload(file,folder)
    }

    @Post("upload-multiple")
    @UseInterceptors(FilesInterceptor('files',10))
    uploadMultiple(@UploadedFile() files:Express.Multer.File[],@Body('folder') folder:string){
        return this.documentService.uploadMultiplFiles(files,folder)
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    replace(@Param('id') id:string, @UploadedFile() file:Express.Multer.File){
        return this.documentService.replace(id,file)
    }

    @Delete(':id')
    delete(@Param('id') id:string){
        return this.documentService.deleteMedia(id)
    }

    @Get()
    findAll(){
        return this.documentService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id:string){
        return this.documentService.findUnique(id)
    }
}
